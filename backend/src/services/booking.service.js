import mongoose from 'mongoose';
import { DateTime } from 'luxon';
import Batch from '../models/Batch.js';
import Course from '../models/Course.js';
import Session from '../models/Session.js';
import Enrollment from '../models/Enrollment.js';
import Attendance from '../models/Attendance.js';
import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';
import { sendEmail, emailTemplates } from './email.service.js';
import { createNotification } from './notification.service.js';

/**
 * Enroll a student into a batch.
 * Uses an atomic findOneAndUpdate with a capacity guard to prevent race
 * conditions between two students grabbing the last seat simultaneously.
 * Falls back to a waitlist when the batch is full.
 */
export async function enrollStudentInBatch({ studentId, batchId }) {
  const batch = await Batch.findOne({ _id: batchId, isActive: true });
  if (!batch) throw new ApiError(404, 'Batch not found.');

  const course = await Course.findById(batch.courseId);
  if (!course) throw new ApiError(404, 'Course not found.');

  const existing = await Enrollment.findOne({
    studentId,
    batchId,
    status: { $in: ['active', 'waitlisted'] },
  });
  if (existing) throw new ApiError(409, 'You are already enrolled or waitlisted for this batch.');

  // Atomic capacity check: only succeeds if enrolledCount < capacity at the moment of update.
  const updatedBatch = await Batch.findOneAndUpdate(
    { _id: batchId, $expr: { $lt: ['$enrolledCount', '$capacity'] } },
    { $inc: { enrolledCount: 1 } },
    { new: true }
  );

  let enrollment;
  if (updatedBatch) {
    enrollment = await Enrollment.create({
      studentId,
      courseId: batch.courseId,
      batchId,
      status: 'active',
    });

    // Bump enrolledCount + create Attendance placeholders for upcoming sessions
    await Session.updateMany(
      { batchId, status: 'scheduled', startTime: { $gte: new Date() } },
      { $inc: { enrolledCount: 1 } }
    );
    const upcomingSessions = await Session.find({
      batchId,
      status: 'scheduled',
      startTime: { $gte: new Date() },
    }).select('_id courseId');
    if (upcomingSessions.length) {
      await Attendance.insertMany(
        upcomingSessions.map((s) => ({
          sessionId: s._id,
          studentId,
          courseId: s.courseId,
          status: 'unmarked',
        })),
        { ordered: false }
      ).catch(() => {}); // ignore duplicate-key races
    }

    void notifyEnrollment(studentId, course, batch);
  } else {
    // Batch is full -> waitlist
    const waitlistCount = await Enrollment.countDocuments({ batchId, status: 'waitlisted' });
    enrollment = await Enrollment.create({
      studentId,
      courseId: batch.courseId,
      batchId,
      status: 'waitlisted',
      waitlistPosition: waitlistCount + 1,
    });
  }

  return enrollment;
}

async function notifyEnrollment(studentId, course, batch) {
  const User = mongoose.model('User');
  const student = await User.findById(studentId);
  if (!student) return;
  const tpl = emailTemplates.enrollmentConfirmed(student.name, course.title, batch.name);
  await sendEmail({ to: student.email, ...tpl });
  await createNotification({
    userId: studentId,
    type: 'enrollment_confirmed',
    title: 'Enrollment confirmed',
    message: `You're enrolled in ${course.title} (${batch.name}).`,
    link: `/calendar`,
  });
}

/**
 * Cancel a student's enrollment in a batch, respecting the configured
 * cutoff window for the *next* upcoming session. Auto-promotes the first
 * waitlisted student when a seat opens up.
 */
export async function cancelEnrollment({ studentId, enrollmentId, isAdminOverride = false }) {
  const enrollment = await Enrollment.findOne({ _id: enrollmentId, studentId });
  if (!enrollment) throw new ApiError(404, 'Enrollment not found.');
  if (enrollment.status === 'cancelled') throw new ApiError(400, 'Enrollment already cancelled.');

  if (!isAdminOverride && enrollment.status === 'active') {
    const nextSession = await Session.findOne({
      batchId: enrollment.batchId,
      status: 'scheduled',
      startTime: { $gte: new Date() },
    }).sort({ startTime: 1 });

    if (nextSession) {
      const cutoff = DateTime.fromJSDate(nextSession.startTime).minus({ hours: env.cancellationCutoffHours });
      if (DateTime.now() > cutoff) {
        throw new ApiError(
          400,
          `Cancellations must be made at least ${env.cancellationCutoffHours} hours before the next session.`
        );
      }
    }
  }

  const wasActive = enrollment.status === 'active';
  enrollment.status = 'cancelled';
  enrollment.cancelledAt = new Date();
  await enrollment.save();

  if (wasActive) {
    await Batch.updateOne({ _id: enrollment.batchId }, { $inc: { enrolledCount: -1 } });
    await Session.updateMany(
      { batchId: enrollment.batchId, status: 'scheduled', startTime: { $gte: new Date() } },
      { $inc: { enrolledCount: -1 } }
    );
    await promoteFromWaitlist(enrollment.batchId);
  }

  return enrollment;
}

async function promoteFromWaitlist(batchId) {
  const next = await Enrollment.findOne({ batchId, status: 'waitlisted' }).sort({ waitlistPosition: 1 });
  if (!next) return;

  const updatedBatch = await Batch.findOneAndUpdate(
    { _id: batchId, $expr: { $lt: ['$enrolledCount', '$capacity'] } },
    { $inc: { enrolledCount: 1 } },
    { new: true }
  );
  if (!updatedBatch) return;

  next.status = 'active';
  next.waitlistPosition = null;
  await next.save();

  await Session.updateMany(
    { batchId, status: 'scheduled', startTime: { $gte: new Date() } },
    { $inc: { enrolledCount: 1 } }
  );

  const course = await Course.findById(next.courseId);
  const User = mongoose.model('User');
  const student = await User.findById(next.studentId);
  if (student && course) {
    const tpl = emailTemplates.waitlistPromoted(student.name, course.title);
    await sendEmail({ to: student.email, ...tpl });
    await createNotification({
      userId: next.studentId,
      type: 'waitlist_promoted',
      title: 'Moved off the waitlist',
      message: `A spot opened up in ${course.title}. You're now enrolled.`,
      link: '/calendar',
    });
  }
}

/**
 * Book (or double-check) a one-off session for a student, detecting
 * conflicts: the tutor or the student cannot be double-booked in an
 * overlapping time window.
 */
export async function assertNoConflict({ tutorId, studentIds = [], startTime, endTime, excludeSessionId }) {
  const overlapQuery = {
    status: 'scheduled',
    startTime: { $lt: endTime },
    endTime: { $gt: startTime },
  };
  if (excludeSessionId) overlapQuery._id = { $ne: excludeSessionId };

  const tutorConflict = await Session.findOne({ ...overlapQuery, tutorId });
  if (tutorConflict) {
    throw new ApiError(409, 'Tutor already has a session scheduled in this time slot.');
  }

  if (studentIds.length) {
    const studentSessionIds = await Attendance.find({
      studentId: { $in: studentIds },
    }).distinct('sessionId');
    if (studentSessionIds.length) {
      const conflictingSession = await Session.findOne({
        ...overlapQuery,
        _id: { $in: studentSessionIds },
      });
      if (conflictingSession) {
        throw new ApiError(409, 'One or more students already have a session in this time slot.');
      }
    }
  }
}

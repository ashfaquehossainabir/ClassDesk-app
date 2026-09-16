import { DateTime } from 'luxon';
import Attendance from '../models/Attendance.js';
import Session from '../models/Session.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';

function assertNotLocked(session, override) {
  if (!session.attendanceLocked) return;
  if (override) return;
  throw new ApiError(
    400,
    `Attendance for this session is locked (${env.attendanceLockHours}h window passed). An admin override is required.`
  );
}

export const markAttendance = asyncHandler(async (req, res) => {
  const session = await Session.findById(req.params.sessionId);
  if (!session) throw new ApiError(404, 'Session not found.');

  const isAdmin = req.user.role === 'admin';
  assertNotLocked(session, isAdmin && req.body.override);

  const { entries } = req.body;
  const ops = entries.map((e) => ({
    updateOne: {
      filter: { sessionId: session._id, studentId: e.studentId },
      update: { status: e.status, markedBy: req.user.id, markedAt: new Date() },
      upsert: true,
    },
  }));
  await Attendance.bulkWrite(ops);

  const records = await Attendance.find({ sessionId: session._id }).populate('studentId', 'name email');
  return sendResponse(res, 200, { attendance: records }, 'Attendance saved.');
});

export const bulkMarkAll = asyncHandler(async (req, res) => {
  const session = await Session.findById(req.params.sessionId);
  if (!session) throw new ApiError(404, 'Session not found.');

  const isAdmin = req.user.role === 'admin';
  assertNotLocked(session, isAdmin && req.body.override);

  const status = req.body.status || 'present';
  await Attendance.updateMany(
    { sessionId: session._id },
    { status, markedBy: req.user.id, markedAt: new Date() }
  );

  const records = await Attendance.find({ sessionId: session._id }).populate('studentId', 'name email');
  return sendResponse(res, 200, { attendance: records }, `All students marked ${status}.`);
});

export const getSessionAttendance = asyncHandler(async (req, res) => {
  const records = await Attendance.find({ sessionId: req.params.sessionId }).populate('studentId', 'name email');
  return sendResponse(res, 200, { attendance: records });
});

export const getStudentCourseAttendance = asyncHandler(async (req, res) => {
  const { studentId, courseId } = req.params;
  if (req.user.role === 'student' && req.user.id !== studentId) {
    throw new ApiError(403, 'You can only view your own attendance.');
  }

  const records = await Attendance.find({ studentId, courseId, status: { $ne: 'unmarked' } });
  const total = records.length;
  const present = records.filter((r) => r.status === 'present' || r.status === 'late').length;
  const percentage = total === 0 ? null : Math.round((present / total) * 1000) / 10;

  return sendResponse(res, 200, {
    total,
    present,
    absent: records.filter((r) => r.status === 'absent').length,
    late: records.filter((r) => r.status === 'late').length,
    percentage,
  });
});

// Runs periodically (or lazily on read) to lock attendance windows that have passed.
export async function lockPastAttendance() {
  const cutoff = DateTime.now().minus({ hours: env.attendanceLockHours }).toJSDate();
  const result = await Session.updateMany(
    { status: 'scheduled', startTime: { $lt: cutoff }, attendanceLocked: false },
    { attendanceLocked: true, attendanceLockedAt: new Date(), status: 'completed' }
  );
  return result.modifiedCount;
}

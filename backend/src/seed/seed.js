/* eslint-disable no-console */
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import Course from '../models/Course.js';
import Batch from '../models/Batch.js';
import Session from '../models/Session.js';
import Enrollment from '../models/Enrollment.js';
import Attendance from '../models/Attendance.js';
import Invoice from '../models/Invoice.js';
import { generateSessionsForBatch } from '../services/sessionGenerator.service.js';

async function seed() {
  await connectDB();
  console.log('[seed] Clearing existing data...');
  await Promise.all([
    User.deleteMany({}),
    Course.deleteMany({}),
    Batch.deleteMany({}),
    Session.deleteMany({}),
    Enrollment.deleteMany({}),
    Attendance.deleteMany({}),
    Invoice.deleteMany({}),
  ]);

  console.log('[seed] Creating users...');
  const admin = await User.create({
    name: 'Amara Chen',
    email: 'admin@classdesk.app',
    password: 'Password123!',
    role: 'admin',
    timezone: 'America/New_York',
  });

  const tutors = await User.create([
    { name: 'David Okafor', email: 'tutor.david@classdesk.app', password: 'Password123!', role: 'tutor', timezone: 'America/New_York' },
    { name: 'Priya Nair', email: 'tutor.priya@classdesk.app', password: 'Password123!', role: 'tutor', timezone: 'Asia/Kolkata' },
  ]);

  const students = await User.create([
    { name: 'Liam Turner', email: 'student.liam@classdesk.app', password: 'Password123!', role: 'student', timezone: 'America/Los_Angeles' },
    { name: 'Sofia Martinez', email: 'student.sofia@classdesk.app', password: 'Password123!', role: 'student', timezone: 'Europe/Madrid' },
    { name: 'Noah Kim', email: 'student.noah@classdesk.app', password: 'Password123!', role: 'student', timezone: 'Asia/Seoul' },
    { name: 'Ava Johnson', email: 'student.ava@classdesk.app', password: 'Password123!', role: 'student', timezone: 'America/New_York' },
    { name: 'Ethan Brown', email: 'student.ethan@classdesk.app', password: 'Password123!', role: 'student', timezone: 'America/Chicago' },
  ]);

  console.log('[seed] Creating courses...');
  const [algebra, essayWriting, spanish] = await Course.create([
    {
      title: 'Algebra Foundations',
      subject: 'Mathematics',
      description: 'Core algebra concepts for middle and early high school students.',
      tutorId: tutors[0]._id,
      pricingType: 'monthly',
      price: 120,
      capacity: 15,
      coverColor: '#6366F1',
    },
    {
      title: 'Essay Writing Workshop',
      subject: 'English',
      description: 'Structured writing practice with weekly feedback.',
      tutorId: tutors[0]._id,
      pricingType: 'monthly',
      price: 100,
      capacity: 10,
      coverColor: '#10B981',
    },
    {
      title: 'Conversational Spanish',
      subject: 'Languages',
      description: 'Practical spoken Spanish for beginners to intermediate learners.',
      tutorId: tutors[1]._id,
      pricingType: 'per_session',
      price: 25,
      capacity: 8,
      coverColor: '#F59E0B',
    },
  ]);

  console.log('[seed] Creating batches + generating sessions...');
  const today = new Date();
  const in12Weeks = new Date(today.getTime() + 12 * 7 * 24 * 60 * 60 * 1000);

  const batchDefs = [
    {
      courseId: algebra._id,
      tutorId: tutors[0]._id,
      name: 'Batch A — Evenings',
      timezone: 'America/New_York',
      recurringSlots: [
        { dayOfWeek: 0, startTime: '18:00', endTime: '19:00' },
        { dayOfWeek: 2, startTime: '18:00', endTime: '19:00' },
      ],
      startDate: today,
      endDate: in12Weeks,
      capacity: 15,
    },
    {
      courseId: essayWriting._id,
      tutorId: tutors[0]._id,
      name: 'Batch A — Weekend Mornings',
      timezone: 'America/New_York',
      recurringSlots: [{ dayOfWeek: 6, startTime: '10:00', endTime: '11:30' }],
      startDate: today,
      endDate: in12Weeks,
      capacity: 10,
    },
    {
      courseId: spanish._id,
      tutorId: tutors[1]._id,
      name: 'Batch A — Afternoons',
      timezone: 'Asia/Kolkata',
      recurringSlots: [
        { dayOfWeek: 1, startTime: '16:00', endTime: '17:00' },
        { dayOfWeek: 4, startTime: '16:00', endTime: '17:00' },
      ],
      startDate: today,
      endDate: in12Weeks,
      capacity: 8,
    },
  ];

  const batches = [];
  for (const def of batchDefs) {
    const batch = await Batch.create(def);
    await generateSessionsForBatch(batch);
    batches.push(batch);
  }

  console.log('[seed] Enrolling students...');
  const enrollPairs = [
    [students[0], batches[0]],
    [students[1], batches[0]],
    [students[2], batches[1]],
    [students[3], batches[1]],
    [students[4], batches[2]],
    [students[0], batches[2]],
  ];

  for (const [student, batch] of enrollPairs) {
    const enrollment = await Enrollment.create({
      studentId: student._id,
      courseId: batch.courseId,
      batchId: batch._id,
      status: 'active',
    });
    await Batch.updateOne({ _id: batch._id }, { $inc: { enrolledCount: 1 } });

    const sessions = await Session.find({ batchId: batch._id });
    await Session.updateMany({ batchId: batch._id }, { $inc: { enrolledCount: 1 } });
    if (sessions.length) {
      await Attendance.insertMany(
        sessions.map((s) => ({ sessionId: s._id, studentId: student._id, courseId: s.courseId, status: 'unmarked' }))
      );
    }
    void enrollment;
  }

  console.log('[seed] Marking some past attendance for demo data...');
  const pastSessions = await Session.find({ startTime: { $lt: today } });
  for (const session of pastSessions) {
    await Attendance.updateMany(
      { sessionId: session._id },
      { status: Math.random() > 0.15 ? 'present' : 'absent', markedAt: new Date() }
    );
  }

  console.log('[seed] Creating sample invoices...');
  await Invoice.create([
    {
      studentId: students[0]._id,
      courseId: algebra._id,
      batchId: batches[0]._id,
      periodStart: new Date(today.getFullYear(), today.getMonth(), 1),
      periodEnd: new Date(today.getFullYear(), today.getMonth() + 1, 0),
      amount: 120,
      status: 'pending',
      dueDate: new Date(today.getFullYear(), today.getMonth(), 7),
    },
    {
      studentId: students[1]._id,
      courseId: algebra._id,
      batchId: batches[0]._id,
      periodStart: new Date(today.getFullYear(), today.getMonth() - 1, 1),
      periodEnd: new Date(today.getFullYear(), today.getMonth(), 0),
      amount: 120,
      status: 'overdue',
      dueDate: new Date(today.getFullYear(), today.getMonth() - 1, 7),
    },
    {
      studentId: students[2]._id,
      courseId: essayWriting._id,
      batchId: batches[1]._id,
      periodStart: new Date(today.getFullYear(), today.getMonth(), 1),
      periodEnd: new Date(today.getFullYear(), today.getMonth() + 1, 0),
      amount: 100,
      status: 'paid',
      dueDate: new Date(today.getFullYear(), today.getMonth(), 7),
    },
  ]);

  console.log('\n[seed] Done! Sample logins (password: Password123!):');
  console.log(`  Admin:   ${admin.email}`);
  console.log(`  Tutor:   ${tutors[0].email}`);
  console.log(`  Tutor:   ${tutors[1].email}`);
  console.log(`  Student: ${students[0].email}`);
  console.log(`  Student: ${students[1].email}`);

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('[seed] Failed:', err);
  process.exit(1);
});

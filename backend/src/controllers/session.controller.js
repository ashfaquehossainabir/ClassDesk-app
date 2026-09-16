import Session from '../models/Session.js';
import Attendance from '../models/Attendance.js';
import Enrollment from '../models/Enrollment.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { getPagination, getSort, buildMeta } from '../utils/pagination.js';
import { assertNoConflict } from '../services/booking.service.js';

export const createOneOffSession = asyncHandler(async (req, res) => {
  const { courseId, tutorId, title, startTime, endTime, capacity, studentIds = [] } = req.body;

  await assertNoConflict({ tutorId, studentIds, startTime, endTime });

  const session = await Session.create({
    courseId,
    tutorId,
    title,
    startTime,
    endTime,
    capacity,
    isOneOff: true,
    enrolledCount: studentIds.length,
  });

  if (studentIds.length) {
    await Attendance.insertMany(
      studentIds.map((studentId) => ({ sessionId: session._id, studentId, courseId, status: 'unmarked' }))
    );
  }

  return sendResponse(res, 201, { session }, 'One-off session created.');
});

export const listSessions = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const sort = getSort(req.query, 'startTime');
  const filter = { isActive: true };

  if (req.query.courseId) filter.courseId = req.query.courseId;
  if (req.query.batchId) filter.batchId = req.query.batchId;
  if (req.query.status) filter.status = req.query.status;

  if (req.user.role === 'tutor') filter.tutorId = req.user.id;
  if (req.user.role === 'student') {
    const sessionIds = await Attendance.find({ studentId: req.user.id }).distinct('sessionId');
    filter._id = { $in: sessionIds };
  }
  if (req.query.tutorId && req.user.role === 'admin') filter.tutorId = req.query.tutorId;

  if (req.query.from || req.query.to) {
    filter.startTime = {};
    if (req.query.from) filter.startTime.$gte = new Date(req.query.from);
    if (req.query.to) filter.startTime.$lte = new Date(req.query.to);
  }

  const [sessions, total] = await Promise.all([
    Session.find(filter)
      .populate('courseId', 'title subject coverColor')
      .populate('tutorId', 'name')
      .populate('batchId', 'name')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Session.countDocuments(filter),
  ]);

  return sendResponse(res, 200, { sessions, meta: buildMeta({ page, limit, total }) });
});

export const getSession = asyncHandler(async (req, res) => {
  const session = await Session.findOne({ _id: req.params.id, isActive: true })
    .populate('courseId', 'title subject coverColor')
    .populate('tutorId', 'name email')
    .populate('batchId', 'name');
  if (!session) throw new ApiError(404, 'Session not found.');

  const roster = await Attendance.find({ sessionId: session._id }).populate('studentId', 'name email');
  return sendResponse(res, 200, { session, roster });
});

export const cancelSession = asyncHandler(async (req, res) => {
  const session = await Session.findOneAndUpdate(
    { _id: req.params.id, status: 'scheduled' },
    { status: 'cancelled' },
    { new: true }
  );
  if (!session) throw new ApiError(404, 'Session not found or already cancelled.');
  return sendResponse(res, 200, { session }, 'Session cancelled.');
});

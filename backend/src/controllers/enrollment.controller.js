import Enrollment from '../models/Enrollment.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { getPagination, getSort, buildMeta } from '../utils/pagination.js';
import { enrollStudentInBatch, cancelEnrollment } from '../services/booking.service.js';

export const enroll = asyncHandler(async (req, res) => {
  const studentId = req.user.role === 'student' ? req.user.id : req.body.studentId;
  if (!studentId) throw new ApiError(422, 'studentId is required.');

  const enrollment = await enrollStudentInBatch({ studentId, batchId: req.body.batchId });
  const message = enrollment.status === 'waitlisted' ? 'Batch is full — added to waitlist.' : 'Enrolled successfully.';
  return sendResponse(res, 201, { enrollment }, message);
});

export const cancel = asyncHandler(async (req, res) => {
  const studentId = req.user.role === 'student' ? req.user.id : req.body.studentId;
  const isAdminOverride = req.user.role === 'admin' && req.body.override === true;

  const enrollment = await cancelEnrollment({
    studentId: studentId || req.body.studentId,
    enrollmentId: req.params.id,
    isAdminOverride,
  });
  return sendResponse(res, 200, { enrollment }, 'Enrollment cancelled.');
});

export const listEnrollments = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const sort = getSort(req.query);
  const filter = { isActive: true };

  if (req.user.role === 'student') filter.studentId = req.user.id;
  if (req.query.batchId) filter.batchId = req.query.batchId;
  if (req.query.courseId) filter.courseId = req.query.courseId;
  if (req.query.studentId && req.user.role !== 'student') filter.studentId = req.query.studentId;
  if (req.query.status) filter.status = req.query.status;

  const [enrollments, total] = await Promise.all([
    Enrollment.find(filter)
      .populate('studentId', 'name email')
      .populate('courseId', 'title subject')
      .populate('batchId', 'name')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Enrollment.countDocuments(filter),
  ]);

  return sendResponse(res, 200, { enrollments, meta: buildMeta({ page, limit, total }) });
});

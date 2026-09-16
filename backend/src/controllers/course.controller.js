import Course from '../models/Course.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { getPagination, getSort, buildMeta } from '../utils/pagination.js';

export const createCourse = asyncHandler(async (req, res) => {
  const tutorId = req.body.tutorId || (req.user.role === 'tutor' ? req.user.id : undefined);
  if (!tutorId) throw new ApiError(422, 'tutorId is required.');

  const course = await Course.create({ ...req.body, tutorId });
  return sendResponse(res, 201, { course }, 'Course created.');
});

export const listCourses = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const sort = getSort(req.query);
  const filter = { isActive: true };

  if (req.query.subject) filter.subject = req.query.subject;
  if (req.query.tutorId) filter.tutorId = req.query.tutorId;
  if (req.query.search) filter.$text = { $search: req.query.search };

  const [courses, total] = await Promise.all([
    Course.find(filter).populate('tutorId', 'name email').sort(sort).skip(skip).limit(limit),
    Course.countDocuments(filter),
  ]);

  return sendResponse(res, 200, { courses, meta: buildMeta({ page, limit, total }) });
});

export const getCourse = asyncHandler(async (req, res) => {
  const course = await Course.findOne({ _id: req.params.id, isActive: true }).populate('tutorId', 'name email');
  if (!course) throw new ApiError(404, 'Course not found.');
  return sendResponse(res, 200, { course });
});

export const updateCourse = asyncHandler(async (req, res) => {
  const course = await Course.findOneAndUpdate({ _id: req.params.id, isActive: true }, req.body, {
    new: true,
    runValidators: true,
  });
  if (!course) throw new ApiError(404, 'Course not found.');
  return sendResponse(res, 200, { course }, 'Course updated.');
});

export const deleteCourse = asyncHandler(async (req, res) => {
  const course = await Course.findOneAndUpdate({ _id: req.params.id }, { isActive: false }, { new: true });
  if (!course) throw new ApiError(404, 'Course not found.');
  return sendResponse(res, 200, null, 'Course deleted.');
});

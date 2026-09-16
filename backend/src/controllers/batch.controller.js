import Batch from '../models/Batch.js';
import Course from '../models/Course.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { getPagination, getSort, buildMeta } from '../utils/pagination.js';
import { generateSessionsForBatch } from '../services/sessionGenerator.service.js';
import Session from '../models/Session.js';

export const createBatch = asyncHandler(async (req, res) => {
  const course = await Course.findOne({ _id: req.body.courseId, isActive: true });
  if (!course) throw new ApiError(404, 'Course not found.');

  const tutorId = req.body.tutorId || course.tutorId;
  const batch = await Batch.create({ ...req.body, tutorId });

  const sessions = await generateSessionsForBatch(batch);

  return sendResponse(res, 201, { batch, sessionsGenerated: sessions.length }, 'Batch created and sessions generated.');
});

export const listBatches = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const sort = getSort(req.query);
  const filter = { isActive: true };

  if (req.query.courseId) filter.courseId = req.query.courseId;
  if (req.query.tutorId) filter.tutorId = req.query.tutorId;

  const [batches, total] = await Promise.all([
    Batch.find(filter)
      .populate('courseId', 'title subject coverColor price pricingType')
      .populate('tutorId', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Batch.countDocuments(filter),
  ]);

  return sendResponse(res, 200, { batches, meta: buildMeta({ page, limit, total }) });
});

export const getBatch = asyncHandler(async (req, res) => {
  const batch = await Batch.findOne({ _id: req.params.id, isActive: true })
    .populate('courseId')
    .populate('tutorId', 'name email');
  if (!batch) throw new ApiError(404, 'Batch not found.');
  return sendResponse(res, 200, { batch });
});

export const updateBatch = asyncHandler(async (req, res) => {
  const batch = await Batch.findOneAndUpdate({ _id: req.params.id, isActive: true }, req.body, {
    new: true,
    runValidators: true,
  });
  if (!batch) throw new ApiError(404, 'Batch not found.');
  return sendResponse(res, 200, { batch }, 'Batch updated.');
});

export const deleteBatch = asyncHandler(async (req, res) => {
  const batch = await Batch.findOneAndUpdate({ _id: req.params.id }, { isActive: false }, { new: true });
  if (!batch) throw new ApiError(404, 'Batch not found.');
  await Session.updateMany(
    { batchId: batch._id, status: 'scheduled', startTime: { $gte: new Date() } },
    { status: 'cancelled' }
  );
  return sendResponse(res, 200, null, 'Batch and its upcoming sessions cancelled.');
});

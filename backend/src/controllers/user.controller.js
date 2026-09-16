import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { getPagination, getSort, buildMeta } from '../utils/pagination.js';

export const listUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const sort = getSort(req.query, 'name');
  const filter = { isActive: true };
  if (req.query.role) filter.role = req.query.role;
  if (req.query.search) filter.$or = [
    { name: { $regex: req.query.search, $options: 'i' } },
    { email: { $regex: req.query.search, $options: 'i' } },
  ];

  const [users, total] = await Promise.all([
    User.find(filter).sort(sort).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  return sendResponse(res, 200, { users: users.map((u) => u.toSafeObject()), meta: buildMeta({ page, limit, total }) });
});

export const getUser = asyncHandler(async (req, res) => {
  const user = await User.findOne({ _id: req.params.id, isActive: true });
  if (!user) throw new ApiError(404, 'User not found.');
  return sendResponse(res, 200, { user: user.toSafeObject() });
});

export const updateUser = asyncHandler(async (req, res) => {
  const allowed = ['name', 'phone', 'avatarUrl', 'timezone', 'parentEmail', 'parentName'];
  const updates = {};
  for (const key of allowed) if (req.body[key] !== undefined) updates[key] = req.body[key];

  const user = await User.findOneAndUpdate({ _id: req.params.id, isActive: true }, updates, { new: true, runValidators: true });
  if (!user) throw new ApiError(404, 'User not found.');
  return sendResponse(res, 200, { user: user.toSafeObject() }, 'User updated.');
});

export const deactivateUser = asyncHandler(async (req, res) => {
  const user = await User.findOneAndUpdate({ _id: req.params.id }, { isActive: false }, { new: true });
  if (!user) throw new ApiError(404, 'User not found.');
  return sendResponse(res, 200, null, 'User deactivated.');
});

import { verifyAccessToken } from '../utils/tokens.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import User from '../models/User.js';

export const authenticate = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.accessToken || req.headers.authorization?.replace('Bearer ', '');
  if (!token) throw new ApiError(401, 'Not authenticated. Please log in.');

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch (err) {
    throw new ApiError(401, 'Session expired. Please log in again.');
  }

  const user = await User.findById(payload.sub);
  if (!user || !user.isActive) throw new ApiError(401, 'Account not found or deactivated.');

  req.user = { id: user._id.toString(), role: user.role, email: user.email, name: user.name };
  next();
});

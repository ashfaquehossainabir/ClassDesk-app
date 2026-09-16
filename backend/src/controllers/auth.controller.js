import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  accessCookieOptions,
  refreshCookieOptions,
} from '../utils/tokens.js';

// clearCookie must be called with the same sameSite/secure/path attributes
// the cookie was set with, or the browser won't recognize it as the same
// cookie and won't actually clear it.
const clearAccessCookieOptions = { ...accessCookieOptions };
delete clearAccessCookieOptions.maxAge;
const clearRefreshCookieOptions = { ...refreshCookieOptions };
delete clearRefreshCookieOptions.maxAge;

function setAuthCookies(res, user) {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  res.cookie('accessToken', accessToken, accessCookieOptions);
  res.cookie('refreshToken', refreshToken, refreshCookieOptions);
  return { accessToken, refreshToken };
}

export const signup = asyncHandler(async (req, res) => {
  const { name, email, password, role, phone, parentEmail, parentName, timezone } = req.body;

  const existing = await User.findOne({ email });
  if (existing) throw new ApiError(409, 'An account with this email already exists.');

  const user = await User.create({
    name,
    email,
    password,
    role: role || 'student',
    phone,
    parentEmail,
    parentName,
    timezone,
  });

  setAuthCookies(res, user);
  return sendResponse(res, 201, { user: user.toSafeObject() }, 'Account created successfully.');
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !user.isActive) throw new ApiError(401, 'Invalid email or password.');

  const match = await user.comparePassword(password);
  if (!match) throw new ApiError(401, 'Invalid email or password.');

  setAuthCookies(res, user);
  return sendResponse(res, 200, { user: user.toSafeObject() }, 'Logged in successfully.');
});

export const logout = asyncHandler(async (req, res) => {
  res.clearCookie('accessToken', clearAccessCookieOptions);
  res.clearCookie('refreshToken', clearRefreshCookieOptions);
  return sendResponse(res, 200, null, 'Logged out successfully.');
});

export const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) throw new ApiError(401, 'No refresh token provided.');

  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw new ApiError(401, 'Invalid or expired refresh token.');
  }

  const user = await User.findById(payload.sub);
  if (!user || !user.isActive) throw new ApiError(401, 'Account not found.');
  if ((user.tokenVersion || 0) !== (payload.tokenVersion || 0)) {
    throw new ApiError(401, 'Refresh token has been revoked.');
  }

  setAuthCookies(res, user);
  return sendResponse(res, 200, { user: user.toSafeObject() }, 'Token refreshed.');
});

export const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) throw new ApiError(404, 'User not found.');
  return sendResponse(res, 200, { user: user.toSafeObject() });
});

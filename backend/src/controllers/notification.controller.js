import Notification from '../models/Notification.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendResponse } from '../utils/ApiResponse.js';
import { getPagination, buildMeta } from '../utils/pagination.js';

export const listNotifications = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { userId: req.user.id, isActive: true };
  if (req.query.unreadOnly === 'true') filter.isRead = false;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter).sort('-createdAt').skip(skip).limit(limit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ userId: req.user.id, isRead: false, isActive: true }),
  ]);

  return sendResponse(res, 200, { notifications, unreadCount, meta: buildMeta({ page, limit, total }) });
});

export const markNotificationRead = asyncHandler(async (req, res) => {
  await Notification.updateOne({ _id: req.params.id, userId: req.user.id }, { isRead: true });
  return sendResponse(res, 200, null, 'Notification marked as read.');
});

export const markAllNotificationsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ userId: req.user.id, isRead: false }, { isRead: true });
  return sendResponse(res, 200, null, 'All notifications marked as read.');
});

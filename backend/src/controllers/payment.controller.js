import Payment from '../models/Payment.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendResponse } from '../utils/ApiResponse.js';
import { getPagination, getSort, buildMeta } from '../utils/pagination.js';

export const listPayments = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const sort = getSort(req.query, '-paidAt');
  const filter = { isActive: true };

  if (req.user.role === 'student') filter.studentId = req.user.id;
  if (req.query.studentId && req.user.role !== 'student') filter.studentId = req.query.studentId;

  const [payments, total] = await Promise.all([
    Payment.find(filter).populate('studentId', 'name email').populate('invoiceId', 'invoiceNumber').sort(sort).skip(skip).limit(limit),
    Payment.countDocuments(filter),
  ]);

  return sendResponse(res, 200, { payments, meta: buildMeta({ page, limit, total }) });
});

import Invoice from '../models/Invoice.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { getPagination, getSort, buildMeta } from '../utils/pagination.js';
import {
  createStripeCheckoutSession,
  handleStripeWebhookEvent,
  markInvoicePaid,
  generateMonthlyInvoices,
} from '../services/invoice.service.js';

export const listInvoices = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const sort = getSort(req.query, '-dueDate');
  const filter = { isActive: true };

  if (req.user.role === 'student') filter.studentId = req.user.id;
  if (req.query.studentId && req.user.role !== 'student') filter.studentId = req.query.studentId;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.courseId) filter.courseId = req.query.courseId;

  const [invoices, total] = await Promise.all([
    Invoice.find(filter)
      .populate('studentId', 'name email')
      .populate('courseId', 'title')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Invoice.countDocuments(filter),
  ]);

  return sendResponse(res, 200, { invoices, meta: buildMeta({ page, limit, total }) });
});

export const getInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id).populate('studentId', 'name email').populate('courseId', 'title');
  if (!invoice) throw new ApiError(404, 'Invoice not found.');
  if (req.user.role === 'student' && invoice.studentId._id.toString() !== req.user.id) {
    throw new ApiError(403, 'You can only view your own invoices.');
  }
  return sendResponse(res, 200, { invoice });
});

export const createCheckoutSession = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id);
  if (!invoice) throw new ApiError(404, 'Invoice not found.');
  if (req.user.role === 'student' && invoice.studentId.toString() !== req.user.id) {
    throw new ApiError(403, 'You can only pay your own invoices.');
  }
  if (invoice.status === 'paid') throw new ApiError(400, 'Invoice already paid.');

  const checkoutSession = await createStripeCheckoutSession(invoice);
  return sendResponse(res, 200, { url: checkoutSession.url }, 'Checkout session created.');
});

export const stripeWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers['stripe-signature'];
  try {
    await handleStripeWebhookEvent(req.body, signature);
    res.json({ received: true });
  } catch (err) {
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

export const recordCashPayment = asyncHandler(async (req, res) => {
  const invoice = await markInvoicePaid({
    invoiceId: req.params.id,
    amount: req.body.amount,
    method: req.body.method || 'cash',
    reference: req.body.reference,
    recordedBy: req.user.id,
  });
  return sendResponse(res, 200, { invoice }, 'Payment recorded.');
});

export const triggerMonthlyInvoiceGeneration = asyncHandler(async (req, res) => {
  const created = await generateMonthlyInvoices(req.body.referenceDate ? new Date(req.body.referenceDate) : new Date());
  return sendResponse(res, 201, { count: created.length }, `${created.length} invoices generated.`);
});

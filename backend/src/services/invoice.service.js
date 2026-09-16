import { DateTime } from 'luxon';
import Stripe from 'stripe';
import Enrollment from '../models/Enrollment.js';
import Course from '../models/Course.js';
import Invoice from '../models/Invoice.js';
import Payment from '../models/Payment.js';
import User from '../models/User.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { sendEmail, emailTemplates } from './email.service.js';
import { createNotification } from './notification.service.js';

const stripe = env.stripeSecretKey ? new Stripe(env.stripeSecretKey) : null;

/**
 * Generates monthly invoices for every active enrollment whose course is
 * priced monthly. Intended to run on the 1st of each month via cron.
 */
export async function generateMonthlyInvoices(referenceDate = new Date()) {
  const periodStart = DateTime.fromJSDate(referenceDate).startOf('month');
  const periodEnd = periodStart.endOf('month');
  const dueDate = periodStart.plus({ days: 7 });

  const enrollments = await Enrollment.find({ status: 'active' }).populate('courseId');
  const created = [];

  for (const enrollment of enrollments) {
    const course = enrollment.courseId;
    if (!course || course.pricingType !== 'monthly') continue;

    const already = await Invoice.findOne({
      studentId: enrollment.studentId,
      courseId: course._id,
      periodStart: periodStart.toJSDate(),
    });
    if (already) continue;

    const invoice = await Invoice.create({
      studentId: enrollment.studentId,
      courseId: course._id,
      batchId: enrollment.batchId,
      periodStart: periodStart.toJSDate(),
      periodEnd: periodEnd.toJSDate(),
      amount: course.price,
      currency: course.currency,
      dueDate: dueDate.toJSDate(),
      status: 'pending',
    });
    created.push(invoice);

    const student = await User.findById(enrollment.studentId);
    if (student) {
      const tpl = emailTemplates.invoiceIssued(
        student.name,
        invoice.invoiceNumber,
        invoice.amount,
        invoice.currency,
        dueDate.toFormat('dd LLL yyyy')
      );
      await sendEmail({ to: student.email, ...tpl });
      await createNotification({
        userId: student._id,
        type: 'invoice_issued',
        title: 'New invoice issued',
        message: `Invoice ${invoice.invoiceNumber} for ${invoice.currency} ${invoice.amount} is due ${dueDate.toFormat('dd LLL')}.`,
        link: '/invoices',
      });
    }
  }

  return created;
}

export async function markOverdueInvoices() {
  const result = await Invoice.updateMany(
    { status: 'pending', dueDate: { $lt: new Date() } },
    { $set: { status: 'overdue' } }
  );
  return result.modifiedCount;
}

export async function sendOverdueReminders() {
  const overdue = await Invoice.find({ status: 'overdue' }).populate('studentId');
  for (const invoice of overdue) {
    const student = invoice.studentId;
    if (!student) continue;
    const tpl = emailTemplates.overdueReminder(
      student.name,
      invoice.invoiceNumber,
      invoice.amount,
      invoice.currency,
      DateTime.fromJSDate(invoice.dueDate).toFormat('dd LLL yyyy')
    );
    await sendEmail({ to: student.email, ...tpl });
  }
  return overdue.length;
}

export async function createStripeCheckoutSession(invoice, successUrl, cancelUrl) {
  if (!stripe) throw new ApiError(500, 'Stripe is not configured on this server.');
  const course = await Course.findById(invoice.courseId);

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: invoice.currency.toLowerCase(),
          unit_amount: Math.round(invoice.amount * 100),
          product_data: { name: `${course?.title || 'Course'} — ${invoice.invoiceNumber}` },
        },
        quantity: 1,
      },
    ],
    metadata: { invoiceId: invoice._id.toString() },
    success_url: successUrl || env.stripeSuccessUrl,
    cancel_url: cancelUrl || env.stripeCancelUrl,
  });

  invoice.stripeCheckoutSessionId = checkoutSession.id;
  await invoice.save();

  return checkoutSession;
}

export async function handleStripeWebhookEvent(rawBody, signature) {
  if (!stripe) throw new ApiError(500, 'Stripe is not configured on this server.');
  const event = stripe.webhooks.constructEvent(rawBody, signature, env.stripeWebhookSecret);

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const invoiceId = session.metadata?.invoiceId;
    if (invoiceId) {
      await markInvoicePaid({
        invoiceId,
        amount: session.amount_total / 100,
        method: 'stripe',
        reference: session.payment_intent,
      });
    }
  }
  return event;
}

export async function markInvoicePaid({ invoiceId, amount, method, reference, recordedBy }) {
  const invoice = await Invoice.findById(invoiceId);
  if (!invoice) throw new ApiError(404, 'Invoice not found.');
  if (invoice.status === 'paid') return invoice;

  invoice.status = 'paid';
  await invoice.save();

  const payment = await Payment.create({
    invoiceId: invoice._id,
    studentId: invoice.studentId,
    amount: amount ?? invoice.amount,
    currency: invoice.currency,
    method,
    reference,
    recordedBy,
  });

  const student = await User.findById(invoice.studentId);
  if (student) {
    const tpl = emailTemplates.paymentReceived(student.name, invoice.invoiceNumber, payment.amount, invoice.currency);
    await sendEmail({ to: student.email, ...tpl });
    await createNotification({
      userId: student._id,
      type: 'payment_received',
      title: 'Payment received',
      message: `We received your payment for invoice ${invoice.invoiceNumber}.`,
      link: '/invoices',
    });
  }

  return invoice;
}

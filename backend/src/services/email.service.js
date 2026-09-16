import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

let transporter;
function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.pass } : undefined,
    });
  }
  return transporter;
}

// All email sends are best-effort: failures are logged, never thrown,
// so a broken SMTP config never breaks booking/attendance/payment flows.
export async function sendEmail({ to, subject, html, text }) {
  if (!to) return;
  try {
    await getTransporter().sendMail({
      from: env.smtp.from,
      to,
      subject,
      html,
      text: text || html?.replace(/<[^>]+>/g, ''),
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`[email] Failed to send "${subject}" to ${to}:`, err.message);
  }
}

export const emailTemplates = {
  enrollmentConfirmed: (studentName, courseTitle, batchName) => ({
    subject: `You're enrolled in ${courseTitle}`,
    html: `<p>Hi ${studentName},</p><p>You're confirmed for <strong>${courseTitle}</strong> (${batchName}). We'll see you in class!</p>`,
  }),
  sessionReminder: (studentName, courseTitle, startTimeLocal) => ({
    subject: `Reminder: ${courseTitle} starts soon`,
    html: `<p>Hi ${studentName},</p><p>Your session for <strong>${courseTitle}</strong> starts at ${startTimeLocal}. See you there!</p>`,
  }),
  invoiceIssued: (studentName, invoiceNumber, amount, currency, dueDate) => ({
    subject: `New invoice ${invoiceNumber} issued`,
    html: `<p>Hi ${studentName},</p><p>An invoice for ${currency} ${amount} is due on ${dueDate}. Invoice #${invoiceNumber}.</p>`,
  }),
  paymentReceived: (studentName, invoiceNumber, amount, currency) => ({
    subject: `Payment received for ${invoiceNumber}`,
    html: `<p>Hi ${studentName},</p><p>We received your payment of ${currency} ${amount} for invoice #${invoiceNumber}. Thank you!</p>`,
  }),
  overdueReminder: (studentName, invoiceNumber, amount, currency, dueDate) => ({
    subject: `Overdue: invoice ${invoiceNumber}`,
    html: `<p>Hi ${studentName},</p><p>Invoice #${invoiceNumber} for ${currency} ${amount} was due on ${dueDate} and is now overdue. Please make payment at your earliest convenience.</p>`,
  }),
  waitlistPromoted: (studentName, courseTitle) => ({
    subject: `You're off the waitlist for ${courseTitle}`,
    html: `<p>Hi ${studentName},</p><p>A spot opened up and you're now enrolled in <strong>${courseTitle}</strong>.</p>`,
  }),
};

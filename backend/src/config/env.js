import dotenv from 'dotenv';
dotenv.config();

const required = ['MONGO_URI', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];
for (const key of required) {
  if (!process.env[key] && process.env.NODE_ENV !== 'test') {
    // eslint-disable-next-line no-console
    console.warn(`[env] Warning: ${key} is not set. Check your .env file.`);
  }
}

// CLIENT_URL may be a single origin or a comma-separated list, e.g.
// "https://classdesk.vercel.app,https://classdesk-git-main-you.vercel.app,http://localhost:5173"
// This lets one backend deployment accept the production Vercel domain, Vercel
// preview deployments, and local dev, all at once.
const clientUrls = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((url) => url.trim())
  .filter(Boolean);

export const env = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: clientUrls[0],
  clientUrls,
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/classdesk',

  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || 'dev_access_secret',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret',
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  cookieDomain: process.env.COOKIE_DOMAIN || 'localhost',

  cancellationCutoffHours: Number(process.env.CANCELLATION_CUTOFF_HOURS || 6),
  attendanceLockHours: Number(process.env.ATTENDANCE_LOCK_HOURS || 48),

  stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  stripeSuccessUrl: process.env.STRIPE_SUCCESS_URL || 'http://localhost:5173/invoices?status=success',
  stripeCancelUrl: process.env.STRIPE_CANCEL_URL || 'http://localhost:5173/invoices?status=cancelled',

  smtp: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 2525),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.EMAIL_FROM || 'ClassDesk <no-reply@classdesk.app>',
  },

  invoiceCronSchedule: process.env.INVOICE_CRON_SCHEDULE || '0 6 1 * *',
  reminderCronSchedule: process.env.REMINDER_CRON_SCHEDULE || '*/30 * * * *',
};

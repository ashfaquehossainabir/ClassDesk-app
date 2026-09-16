import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import apiRoutes from './routes/index.js';
import { stripeWebhook } from './controllers/invoice.controller.js';
import { notFoundHandler, errorHandler } from './middleware/error.middleware.js';
import { generalLimiter } from './middleware/rateLimit.middleware.js';

const app = express();

// Render sits behind a reverse proxy; without this, Express thinks every
// request is plain HTTP, so `secure: true` cookies would never get set and
// req.protocol/req.ip would be wrong.
app.set('trust proxy', 1);

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      // Allow non-browser requests (curl, server-to-server, health checks)
      // that don't send an Origin header at all.
      if (!origin) return callback(null, true);

      if (env.clientUrls.includes(origin)) {
        return callback(null, true);
      }

      // Allow any Vercel preview deployment for this project
      // (e.g. https://classdesk-git-feature-branch-you.vercel.app,
      // https://classdesk-abc123.vercel.app) without having to add every
      // preview URL to CLIENT_URL by hand.
      if (/^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin)) {
        return callback(null, true);
      }

      // eslint-disable-next-line no-console
      console.warn(`[cors] Blocked request from origin: ${origin}`);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);
app.use(morgan(env.nodeEnv === 'development' ? 'dev' : 'combined'));
app.use(generalLimiter);

// Stripe webhook needs the raw request body for signature verification,
// so it must be registered before the JSON body parser.
app.post('/api/v1/invoices/stripe/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/health', (req, res) => res.json({ success: true, message: 'ClassDesk API is running.' }));

app.use('/api/v1', apiRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;

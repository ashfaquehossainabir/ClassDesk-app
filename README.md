# ClassDesk (Beta Version 3.6.1)

A full-stack tuition / class scheduling platform. Tutors and admins manage courses,
recurring batches, sessions, attendance, and billing; students (or parents) browse
courses, book/cancel sessions, and track attendance and payments.

**Stack:** React (Vite + TypeScript) · Express · MongoDB (Mongoose) · TanStack Query ·
Tailwind CSS · Stripe · Nodemailer · node-cron

---

## 1. Project structure

```
classdesk/
├── backend/     Express API (REST, /api/v1)
└── frontend/    React SPA (Vite)
```

See inline comments in `backend/src` and `frontend/src` for details — the backend
follows routes → controllers → services → models, with Zod validation on every
mutating route and a centralized error handler.

## 2. Prerequisites

- Node.js 18+
- A running MongoDB instance (local `mongod` or Atlas)
- (Optional) Stripe account for online payments
- (Optional) SMTP credentials for transactional email (Mailtrap works well for dev)

## 3. Backend setup

```bash
cd backend
cp .env.example .env    # fill in MONGO_URI, JWT secrets, Stripe/SMTP if you have them
npm install
npm run seed             # wipes and seeds sample tutors/students/courses/batches
npm run dev               # starts the API on http://localhost:5000
```

Seeded logins (password for all: `Password123!`):

| Role    | Email                       |
|---------|------------------------------|
| Admin   | admin@classdesk.app          |
| Tutor   | tutor.david@classdesk.app    |
| Tutor   | tutor.priya@classdesk.app    |
| Student | student.liam@classdesk.app   |
| Student | student.sofia@classdesk.app  |

### Environment variables (`backend/.env.example`)

| Variable | Purpose |
|---|---|
| `PORT` | API port (default 5000) |
| `MONGO_URI` | MongoDB connection string |
| `CLIENT_URL` | Frontend origin, used for CORS |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | Signing secrets for access/refresh JWTs |
| `JWT_ACCESS_EXPIRES_IN` / `JWT_REFRESH_EXPIRES_IN` | Token lifetimes |
| `CANCELLATION_CUTOFF_HOURS` | How close to a session a student can still cancel |
| `ATTENDANCE_LOCK_HOURS` | Window after which attendance auto-locks |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Stripe Checkout + webhook verification |
| `STRIPE_SUCCESS_URL` / `STRIPE_CANCEL_URL` | Redirect targets after Checkout |
| `SMTP_HOST/PORT/USER/PASS`, `EMAIL_FROM` | Nodemailer transport |
| `INVOICE_CRON_SCHEDULE` | Cron expression for monthly invoice generation (default: 1st of month, 6am) |
| `REMINDER_CRON_SCHEDULE` | Cron expression for the 24h session-reminder + attendance-lock sweep |

## 4. Frontend setup

```bash
cd frontend
npm install
npm run dev    # starts on http://localhost:5173, proxies /api to :5000
```

Log in with any of the seeded accounts above. The sidebar and dashboard adapt to
the logged-in role (admin / tutor / student).

## 5. API overview

All routes are namespaced under `/api/v1`. Auth uses httpOnly cookies
(`accessToken`, `refreshToken`) — no bearer tokens needed from the browser.

| Resource | Routes |
|---|---|
| Auth | `POST /auth/signup`, `/auth/login`, `/auth/logout`, `/auth/refresh`, `GET /auth/me` |
| Courses | `GET/POST /courses`, `GET/PATCH/DELETE /courses/:id` |
| Batches | `GET/POST /batches`, `GET/PATCH/DELETE /batches/:id` (creating a batch auto-generates its `Session` documents) |
| Sessions | `GET /sessions`, `GET /sessions/:id`, `POST /sessions` (one-off), `PATCH /sessions/:id/cancel` |
| Enrollments | `GET/POST /enrollments`, `PATCH /enrollments/:id/cancel` |
| Attendance | `GET/POST /attendance/session/:sessionId`, `POST /attendance/session/:sessionId/bulk`, `GET /attendance/student/:studentId/course/:courseId` |
| Invoices | `GET /invoices`, `GET /invoices/:id`, `POST /invoices/:id/checkout` (Stripe), `POST /invoices/:id/cash-payment`, `POST /invoices/generate-monthly` |
| Payments | `GET /payments` |
| Notifications | `GET /notifications`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all` |
| Users | `GET /users`, `GET/PATCH/DELETE /users/:id` |
| Dashboard | `GET /dashboard/admin`, `/dashboard/tutor`, `/dashboard/student` |
| Stripe webhook | `POST /invoices/stripe/webhook` (raw body, signature-verified) |

Every list endpoint supports `page`, `limit`, and `sort` (comma-separated,
prefix a field with `-` for descending) query params; most support `search`
and resource-specific filters. Every response follows:

```json
{ "success": true, "message": "...", "data": { ... }, "errors": [] }
```

## 6. Key design notes

- **Race-safe booking.** Enrollment uses an atomic `findOneAndUpdate` with a
  `$expr` capacity guard (`enrolledCount < capacity`) so two students can't take
  the last seat at once; overflow falls back to a waitlist that auto-promotes
  the next student on cancellation.
- **Conflict detection.** One-off sessions check for overlapping time windows
  against both the tutor's and each invited student's existing sessions before
  creating the session.
- **Recurring sessions.** `Batch.recurringSlots` (day + HH:mm in the batch's
  timezone) are expanded into concrete UTC `Session` documents at batch-creation
  time via Luxon, so all storage stays UTC while input/output stays timezone-aware.
- **Attendance locking.** A cron sweep locks (and completes) sessions whose
  start time is older than `ATTENDANCE_LOCK_HOURS`; admins can still override
  with `{ override: true }` on the mark endpoints.
- **Billing.** Monthly invoices are generated by cron (or on-demand via
  `POST /invoices/generate-monthly`) for every active enrollment in a
  monthly-priced course; Stripe Checkout + webhook marks them paid, or an
  admin can record a cash/bank payment manually.

## 7. Running both together

From the repo root, in two terminals:

```bash
# terminal 1
cd backend && npm run dev

# terminal 2
cd frontend && npm run dev
```

Then open http://localhost:5173.

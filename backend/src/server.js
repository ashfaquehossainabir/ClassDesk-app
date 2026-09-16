import app from './app.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import { startCronJobs } from './jobs/invoiceCron.js';
import { startReminderCron } from './jobs/reminderCron.js';

async function start() {
  await connectDB();
  startCronJobs();
  startReminderCron();

  app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`[server] ClassDesk API listening on port ${env.port} (${env.nodeEnv})`);
  });
}

start().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[server] Failed to start:', err);
  process.exit(1);
});

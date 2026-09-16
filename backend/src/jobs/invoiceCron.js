import cron from 'node-cron';
import { env } from '../config/env.js';
import { generateMonthlyInvoices, markOverdueInvoices } from '../services/invoice.service.js';

export function startCronJobs() {
  // Generate monthly invoices (default: 6am on the 1st of every month)
  cron.schedule(env.invoiceCronSchedule, async () => {
    try {
      const created = await generateMonthlyInvoices();
      // eslint-disable-next-line no-console
      console.log(`[cron] Generated ${created.length} monthly invoices.`);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[cron] Monthly invoice generation failed:', err.message);
    }
  });

  // Mark pending invoices past their due date as overdue, once a day
  cron.schedule('0 1 * * *', async () => {
    try {
      const count = await markOverdueInvoices();
      // eslint-disable-next-line no-console
      console.log(`[cron] Marked ${count} invoices overdue.`);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[cron] Overdue sweep failed:', err.message);
    }
  });
}

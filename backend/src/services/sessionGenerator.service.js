import { DateTime } from 'luxon';
import Session from '../models/Session.js';

/**
 * Generates concrete Session documents (stored in UTC) from a Batch's
 * recurring weekly slots, between batch.startDate and batch.endDate inclusive.
 * batch.timezone is the timezone the recurringSlots' HH:mm values are defined in.
 */
export async function generateSessionsForBatch(batch) {
  const sessions = [];
  const zone = batch.timezone || 'UTC';

  const rangeStart = DateTime.fromJSDate(batch.startDate, { zone }).startOf('day');
  const rangeEnd = DateTime.fromJSDate(batch.endDate, { zone }).endOf('day');

  for (const slot of batch.recurringSlots) {
    let cursor = rangeStart.set({ weekday: isoWeekday(slot.dayOfWeek) });
    if (cursor < rangeStart) cursor = cursor.plus({ weeks: 1 });

    while (cursor <= rangeEnd) {
      const [startH, startM] = slot.startTime.split(':').map(Number);
      const [endH, endM] = slot.endTime.split(':').map(Number);

      const startDT = cursor.set({ hour: startH, minute: startM, second: 0, millisecond: 0 });
      const endDT = cursor.set({ hour: endH, minute: endM, second: 0, millisecond: 0 });

      if (startDT >= DateTime.fromJSDate(batch.startDate) || true) {
        sessions.push({
          courseId: batch.courseId,
          batchId: batch._id,
          tutorId: batch.tutorId,
          title: batch.name,
          startTime: startDT.toUTC().toJSDate(),
          endTime: endDT.toUTC().toJSDate(),
          capacity: batch.capacity,
          isOneOff: false,
        });
      }
      cursor = cursor.plus({ weeks: 1 });
    }
  }

  if (sessions.length === 0) return [];
  return Session.insertMany(sessions);
}

// Luxon weekday: 1 (Mon) - 7 (Sun). Our dayOfWeek: 0 (Sun) - 6 (Sat).
function isoWeekday(dayOfWeek) {
  return dayOfWeek === 0 ? 7 : dayOfWeek;
}

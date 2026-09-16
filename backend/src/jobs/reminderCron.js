import cron from 'node-cron';
import { DateTime } from 'luxon';
import { env } from '../config/env.js';
import Session from '../models/Session.js';
import Attendance from '../models/Attendance.js';
import User from '../models/User.js';
import { sendEmail, emailTemplates } from '../services/email.service.js';
import { createNotification } from '../services/notification.service.js';
import { lockPastAttendance } from '../controllers/attendance.controller.js';

// Sends "session starts in 24h" reminders and locks attendance windows that
// have elapsed. Runs on a configurable interval (default every 30 minutes).
export function startReminderCron() {
  cron.schedule(env.reminderCronSchedule, async () => {
    try {
      await sendUpcomingReminders();
      const locked = await lockPastAttendance();
      if (locked) console.log(`[cron] Locked attendance for ${locked} past sessions.`);
    } catch (err) {
      console.error('[cron] Reminder job failed:', err.message);
    }
  });
}

async function sendUpcomingReminders() {
  const now = DateTime.now();
  const windowStart = now.plus({ hours: 24 }).toJSDate();
  const windowEnd = now.plus({ hours: 24, minutes: 30 }).toJSDate();

  const sessions = await Session.find({
    status: 'scheduled',
    startTime: { $gte: windowStart, $lte: windowEnd },
  }).populate('courseId', 'title');

  for (const session of sessions) {
    const attendanceRecords = await Attendance.find({ sessionId: session._id }).populate('studentId', 'name email timezone');
    for (const record of attendanceRecords) {
      const student = record.studentId;
      if (!student) continue;
      const localTime = DateTime.fromJSDate(session.startTime)
        .setZone(student.timezone || 'UTC')
        .toFormat('dd LLL, h:mm a ZZZZ');
      const tpl = emailTemplates.sessionReminder(student.name, session.courseId?.title || session.title, localTime);
      await sendEmail({ to: student.email, ...tpl });
      await createNotification({
        userId: student._id,
        type: 'session_reminder',
        title: 'Upcoming session',
        message: `${session.courseId?.title || session.title} starts at ${localTime}.`,
        link: '/calendar',
      });
    }
  }
}

import { DateTime } from 'luxon';
import Session from '../models/Session.js';
import Invoice from '../models/Invoice.js';
import Enrollment from '../models/Enrollment.js';
import Attendance from '../models/Attendance.js';
import Payment from '../models/Payment.js';
import Batch from '../models/Batch.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendResponse } from '../utils/ApiResponse.js';

export const adminDashboard = asyncHandler(async (req, res) => {
  const now = DateTime.now();
  const startOfMonth = now.startOf('month').toJSDate();
  const startOfLastMonth = now.minus({ months: 1 }).startOf('month').toJSDate();
  const endOfLastMonth = now.startOf('month').toJSDate();
  const startOfToday = now.startOf('day').toJSDate();
  const endOfToday = now.endOf('day').toJSDate();

  const [
    revenueThisMonth,
    revenueLastMonth,
    unpaidInvoices,
    todaysSessions,
    enrollmentCount,
    attendanceAgg,
    recentPayments,
  ] = await Promise.all([
    Payment.aggregate([{ $match: { paidAt: { $gte: startOfMonth } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    Payment.aggregate([
      { $match: { paidAt: { $gte: startOfLastMonth, $lt: endOfLastMonth } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Invoice.countDocuments({ status: { $in: ['pending', 'overdue'] } }),
    Session.find({ startTime: { $gte: startOfToday, $lte: endOfToday }, status: { $ne: 'cancelled' } })
      .populate('courseId', 'title coverColor')
      .populate('tutorId', 'name')
      .sort('startTime'),
    Enrollment.countDocuments({ status: 'active' }),
    Attendance.aggregate([
      { $match: { status: { $ne: 'unmarked' } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Payment.find().sort('-paidAt').limit(8).populate('studentId', 'name'),
  ]);

  const present = attendanceAgg.find((a) => a._id === 'present')?.count || 0;
  const late = attendanceAgg.find((a) => a._id === 'late')?.count || 0;
  const totalMarked = attendanceAgg.reduce((sum, a) => sum + a.count, 0);
  const attendanceRate = totalMarked ? Math.round(((present + late) / totalMarked) * 1000) / 10 : null;

  // Revenue trend for the last 6 months (for the chart)
  const sixMonthsAgo = now.minus({ months: 5 }).startOf('month').toJSDate();
  const monthlyRevenue = await Payment.aggregate([
    { $match: { paidAt: { $gte: sixMonthsAgo } } },
    {
      $group: {
        _id: { year: { $year: '$paidAt' }, month: { $month: '$paidAt' } },
        total: { $sum: '$amount' },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  const thisMonthRevenue = revenueThisMonth[0]?.total || 0;
  const lastMonthRevenue = revenueLastMonth[0]?.total || 0;
  const revenueTrend = lastMonthRevenue === 0 ? null : Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 1000) / 10;

  return sendResponse(res, 200, {
    revenueThisMonth: thisMonthRevenue,
    revenueTrend,
    unpaidInvoices,
    todaysSessions,
    enrollmentCount,
    attendanceRate,
    monthlyRevenue: monthlyRevenue.map((m) => ({
      label: DateTime.fromObject({ year: m._id.year, month: m._id.month }).toFormat('LLL'),
      total: m.total,
    })),
    recentActivity: recentPayments.map((p) => ({
      id: p._id,
      type: 'payment',
      message: `${p.studentId?.name || 'A student'} paid ${p.currency} ${p.amount}`,
      at: p.paidAt,
    })),
  });
});

export const tutorDashboard = asyncHandler(async (req, res) => {
  const now = DateTime.now();
  const startOfToday = now.startOf('day').toJSDate();
  const endOfToday = now.endOf('day').toJSDate();
  const startOfWeek = now.startOf('week').toJSDate();
  const endOfWeek = now.endOf('week').toJSDate();

  const [todaysSessions, weekSessions, batches] = await Promise.all([
    Session.find({ tutorId: req.user.id, startTime: { $gte: startOfToday, $lte: endOfToday }, status: { $ne: 'cancelled' } })
      .populate('courseId', 'title coverColor')
      .sort('startTime'),
    Session.find({ tutorId: req.user.id, startTime: { $gte: startOfWeek, $lte: endOfWeek }, status: { $ne: 'cancelled' } })
      .populate('courseId', 'title coverColor')
      .sort('startTime'),
    Batch.find({ tutorId: req.user.id, isActive: true }).populate('courseId', 'title'),
  ]);

  return sendResponse(res, 200, {
    todaysSessions,
    weekSessions,
    batches: batches.map((b) => ({ id: b._id, name: b.name, course: b.courseId?.title, enrolledCount: b.enrolledCount, capacity: b.capacity })),
  });
});

export const studentDashboard = asyncHandler(async (req, res) => {
  const now = new Date();

  const [upcomingSessionIds, invoices, enrollments] = await Promise.all([
    Attendance.find({ studentId: req.user.id }).distinct('sessionId'),
    Invoice.find({ studentId: req.user.id, status: { $in: ['pending', 'overdue'] } }),
    Enrollment.find({ studentId: req.user.id, status: 'active' }).populate('courseId', 'title subject coverColor'),
  ]);

  const upcomingSessions = await Session.find({
    _id: { $in: upcomingSessionIds },
    startTime: { $gte: now },
    status: 'scheduled',
  })
    .populate('courseId', 'title coverColor')
    .sort('startTime')
    .limit(10);

  const outstandingDues = invoices.reduce((sum, i) => sum + i.amount, 0);

  const attendanceByCourse = await Promise.all(
    enrollments.map(async (e) => {
      const records = await Attendance.find({ studentId: req.user.id, courseId: e.courseId._id, status: { $ne: 'unmarked' } });
      const present = records.filter((r) => r.status === 'present' || r.status === 'late').length;
      const percentage = records.length ? Math.round((present / records.length) * 1000) / 10 : null;
      return { courseId: e.courseId._id, title: e.courseId.title, percentage };
    })
  );

  return sendResponse(res, 200, {
    upcomingSessions,
    outstandingDues,
    outstandingInvoiceCount: invoices.length,
    attendanceByCourse,
    activeEnrollments: enrollments.length,
  });
});

import { Router } from 'express';
import authRoutes from './auth.routes.js';
import courseRoutes from './course.routes.js';
import batchRoutes from './batch.routes.js';
import sessionRoutes from './session.routes.js';
import enrollmentRoutes from './enrollment.routes.js';
import attendanceRoutes from './attendance.routes.js';
import invoiceRoutes from './invoice.routes.js';
import paymentRoutes from './payment.routes.js';
import notificationRoutes from './notification.routes.js';
import userRoutes from './user.routes.js';
import dashboardRoutes from './dashboard.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/courses', courseRoutes);
router.use('/batches', batchRoutes);
router.use('/sessions', sessionRoutes);
router.use('/enrollments', enrollmentRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/payments', paymentRoutes);
router.use('/notifications', notificationRoutes);
router.use('/users', userRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;

import { Router } from 'express';
import { adminDashboard, tutorDashboard, studentDashboard } from '../controllers/dashboard.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';

const router = Router();

router.get('/admin', authenticate, requireRole('admin'), adminDashboard);
router.get('/tutor', authenticate, requireRole('admin', 'tutor'), tutorDashboard);
router.get('/student', authenticate, requireRole('admin', 'student'), studentDashboard);

export default router;

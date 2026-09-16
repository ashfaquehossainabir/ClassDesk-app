import { Router } from 'express';
import * as ctrl from '../controllers/attendance.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { markAttendanceSchema, bulkMarkSchema } from '../validators/session.validator.js';

const router = Router();

router.get('/session/:sessionId', authenticate, requireRole('admin', 'tutor'), ctrl.getSessionAttendance);
router.post('/session/:sessionId', authenticate, requireRole('admin', 'tutor'), validate(markAttendanceSchema), ctrl.markAttendance);
router.post('/session/:sessionId/bulk', authenticate, requireRole('admin', 'tutor'), validate(bulkMarkSchema), ctrl.bulkMarkAll);
router.get('/student/:studentId/course/:courseId', authenticate, ctrl.getStudentCourseAttendance);

export default router;

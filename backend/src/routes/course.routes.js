import { Router } from 'express';
import * as ctrl from '../controllers/course.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createCourseSchema, updateCourseSchema } from '../validators/course.validator.js';

const router = Router();

router.get('/', authenticate, ctrl.listCourses);
router.get('/:id', authenticate, ctrl.getCourse);
router.post('/', authenticate, requireRole('admin', 'tutor'), validate(createCourseSchema), ctrl.createCourse);
router.patch('/:id', authenticate, requireRole('admin', 'tutor'), validate(updateCourseSchema), ctrl.updateCourse);
router.delete('/:id', authenticate, requireRole('admin', 'tutor'), ctrl.deleteCourse);

export default router;

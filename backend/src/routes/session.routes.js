import { Router } from 'express';
import * as ctrl from '../controllers/session.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createOneOffSessionSchema } from '../validators/session.validator.js';

const router = Router();

router.get('/', authenticate, ctrl.listSessions);
router.get('/:id', authenticate, ctrl.getSession);
router.post('/', authenticate, requireRole('admin', 'tutor'), validate(createOneOffSessionSchema), ctrl.createOneOffSession);
router.patch('/:id/cancel', authenticate, requireRole('admin', 'tutor'), ctrl.cancelSession);

export default router;

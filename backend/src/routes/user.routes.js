import { Router } from 'express';
import * as ctrl from '../controllers/user.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';

const router = Router();

router.get('/', authenticate, requireRole('admin', 'tutor'), ctrl.listUsers);
router.get('/:id', authenticate, ctrl.getUser);
router.patch('/:id', authenticate, ctrl.updateUser);
router.delete('/:id', authenticate, requireRole('admin'), ctrl.deactivateUser);

export default router;

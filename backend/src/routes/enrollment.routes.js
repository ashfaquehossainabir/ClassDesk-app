import { Router } from 'express';
import * as ctrl from '../controllers/enrollment.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', authenticate, ctrl.listEnrollments);
router.post('/', authenticate, ctrl.enroll);
router.patch('/:id/cancel', authenticate, ctrl.cancel);

export default router;

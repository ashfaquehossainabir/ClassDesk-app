import { Router } from 'express';
import * as ctrl from '../controllers/notification.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', authenticate, ctrl.listNotifications);
router.patch('/:id/read', authenticate, ctrl.markNotificationRead);
router.patch('/read-all', authenticate, ctrl.markAllNotificationsRead);

export default router;

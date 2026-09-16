import { Router } from 'express';
import * as ctrl from '../controllers/payment.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', authenticate, ctrl.listPayments);

export default router;

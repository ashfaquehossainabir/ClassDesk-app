import { Router } from 'express';
import * as ctrl from '../controllers/invoice.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';

const router = Router();

router.get('/', authenticate, ctrl.listInvoices);
router.get('/:id', authenticate, ctrl.getInvoice);
router.post('/:id/checkout', authenticate, ctrl.createCheckoutSession);
router.post('/:id/cash-payment', authenticate, requireRole('admin'), ctrl.recordCashPayment);
router.post('/generate-monthly', authenticate, requireRole('admin'), ctrl.triggerMonthlyInvoiceGeneration);

export default router;

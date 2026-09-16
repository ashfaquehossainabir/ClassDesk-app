import { Router } from 'express';
import * as ctrl from '../controllers/batch.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createBatchSchema, updateBatchSchema } from '../validators/batch.validator.js';

const router = Router();

router.get('/', authenticate, ctrl.listBatches);
router.get('/:id', authenticate, ctrl.getBatch);
router.post('/', authenticate, requireRole('admin', 'tutor'), validate(createBatchSchema), ctrl.createBatch);
router.patch('/:id', authenticate, requireRole('admin', 'tutor'), validate(updateBatchSchema), ctrl.updateBatch);
router.delete('/:id', authenticate, requireRole('admin', 'tutor'), ctrl.deleteBatch);

export default router;

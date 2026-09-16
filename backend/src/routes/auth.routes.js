import { Router } from 'express';
import { signup, login, logout, refresh, me } from '../controllers/auth.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { signupSchema, loginSchema } from '../validators/auth.validator.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authLimiter } from '../middleware/rateLimit.middleware.js';

const router = Router();

router.post('/signup', authLimiter, validate(signupSchema), signup);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/logout', logout);
router.post('/refresh', refresh);
router.get('/me', authenticate, me);

export default router;

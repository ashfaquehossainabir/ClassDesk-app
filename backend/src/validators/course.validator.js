import { z } from 'zod';
import { objectId } from './common.validator.js';

export const createCourseSchema = z.object({
  title: z.string().min(2).max(150),
  subject: z.string().min(2).max(100),
  description: z.string().max(2000).optional(),
  tutorId: objectId.optional(),
  pricingType: z.enum(['per_session', 'monthly']).default('monthly'),
  price: z.number().nonnegative(),
  currency: z.string().default('USD'),
  capacity: z.number().int().positive(),
  coverColor: z.string().optional(),
});

export const updateCourseSchema = createCourseSchema.partial();

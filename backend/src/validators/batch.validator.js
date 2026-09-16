import { z } from 'zod';
import { objectId } from './common.validator.js';

const recurringSlotSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Use HH:mm format'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Use HH:mm format'),
});

export const createBatchSchema = z.object({
  courseId: objectId,
  tutorId: objectId.optional(),
  name: z.string().min(2).max(150),
  timezone: z.string().default('UTC'),
  recurringSlots: z.array(recurringSlotSchema).min(1),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  capacity: z.number().int().positive(),
});

export const updateBatchSchema = createBatchSchema.partial();

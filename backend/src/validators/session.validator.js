import { z } from 'zod';
import { objectId } from './common.validator.js';

export const createOneOffSessionSchema = z.object({
  courseId: objectId,
  tutorId: objectId,
  title: z.string().min(2).max(150),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  capacity: z.number().int().positive(),
  studentIds: z.array(objectId).optional(),
});

export const markAttendanceSchema = z.object({
  entries: z
    .array(
      z.object({
        studentId: objectId,
        status: z.enum(['present', 'absent', 'late', 'unmarked']),
      })
    )
    .min(1),
  override: z.boolean().optional(),
});

export const bulkMarkSchema = z.object({
  status: z.enum(['present', 'absent', 'late']).default('present'),
  override: z.boolean().optional(),
});

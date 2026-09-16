import { z } from 'zod';

export const signupSchema = z.object({
  name: z.string().min(2, 'Name is too short').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['admin', 'tutor', 'student']).default('student'),
  phone: z.string().optional(),
  parentEmail: z.string().email().optional(),
  parentName: z.string().optional(),
  timezone: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

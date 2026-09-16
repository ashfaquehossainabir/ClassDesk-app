export type Role = 'admin' | 'tutor' | 'student';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string;
  avatarUrl?: string;
  timezone?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Course {
  _id: string;
  title: string;
  subject: string;
  description?: string;
  tutorId: { _id: string; name: string; email: string } | string;
  pricingType: 'per_session' | 'monthly';
  price: number;
  currency: string;
  capacity: number;
  coverColor: string;
  isActive: boolean;
}

export interface RecurringSlot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface Batch {
  _id: string;
  courseId: Course | string;
  tutorId: { _id: string; name: string } | string;
  name: string;
  timezone: string;
  recurringSlots: RecurringSlot[];
  startDate: string;
  endDate: string;
  capacity: number;
  enrolledCount: number;
  isFull?: boolean;
}

export interface SessionItem {
  _id: string;
  courseId: { _id: string; title: string; coverColor: string } | string;
  batchId?: { _id: string; name: string } | string;
  tutorId: { _id: string; name: string } | string;
  title: string;
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  capacity: number;
  enrolledCount: number;
  attendanceLocked: boolean;
}

export interface Enrollment {
  _id: string;
  studentId: { _id: string; name: string; email: string } | string;
  courseId: { _id: string; title: string; subject: string } | string;
  batchId: { _id: string; name: string } | string;
  status: 'active' | 'waitlisted' | 'cancelled' | 'completed';
  waitlistPosition?: number | null;
}

export interface Invoice {
  _id: string;
  studentId: { _id: string; name: string; email: string } | string;
  courseId: { _id: string; title: string } | string;
  periodStart: string;
  periodEnd: string;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'overdue' | 'void';
  dueDate: string;
  invoiceNumber: string;
}

export interface AttendanceRecord {
  _id: string;
  sessionId: string;
  studentId: { _id: string; name: string; email: string } | string;
  courseId: string;
  status: 'present' | 'absent' | 'late' | 'unmarked';
}

export interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors: Array<{ path: string; message: string }>;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

import { useQuery } from '@tanstack/react-query';
import { DollarSign, ClipboardCheck, CalendarDays, Users, Receipt, BookOpen } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { StatCard } from '@/components/dashboard/StatCard';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { UpcomingSessions } from '@/components/dashboard/UpcomingSessions';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatCurrency } from '@/lib/utils';
import type { ApiResponse } from '@/types';

export default function DashboardHome() {
  const role = useAuthStore((s) => s.user?.role);

  if (role === 'admin') return <AdminDashboard />;
  if (role === 'tutor') return <TutorDashboard />;
  return <StudentDashboard />;
}

function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'admin'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<any>>('/dashboard/admin');
      return res.data.data;
    },
  });

  if (isLoading) return <DashboardSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Overview</h1>
        <p className="text-sm text-zinc-500">Here's what's happening across ClassDesk this month.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Revenue this month" value={formatCurrency(data.revenueThisMonth)} icon={DollarSign} trend={data.revenueTrend} accent="success" />
        <StatCard label="Unpaid invoices" value={String(data.unpaidInvoices)} icon={Receipt} accent="warning" />
        <StatCard label="Active enrollments" value={String(data.enrollmentCount)} icon={Users} accent="brand" />
        <StatCard
          label="Attendance rate"
          value={data.attendanceRate === null ? '—' : `${data.attendanceRate}%`}
          icon={ClipboardCheck}
          accent="brand"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RevenueChart data={data.monthlyRevenue} />
        </div>
        <UpcomingSessions sessions={data.todaysSessions} />
      </div>

      <ActivityFeed items={data.recentActivity} />
    </div>
  );
}

function TutorDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'tutor'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<any>>('/dashboard/tutor');
      return res.data.data;
    },
  });

  if (isLoading) return <DashboardSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Your schedule</h1>
        <p className="text-sm text-zinc-500">{data.todaysSessions.length} sessions today &middot; {data.weekSessions.length} this week</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <UpcomingSessions sessions={data.todaysSessions} />
        <Card>
          <CardHeader>
            <CardTitle>Your batches</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {data.batches.length === 0 ? (
              <EmptyState icon={BookOpen} title="No batches yet" message="Create a course and batch to get started." />
            ) : (
              <ul className="space-y-3">
                {data.batches.map((b: any) => (
                  <li key={b.id} className="flex items-center justify-between gap-3 rounded-xl border border-zinc-100 p-3 dark:border-zinc-800">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">{b.name}</p>
                      <p className="truncate text-xs text-zinc-500">{b.course}</p>
                    </div>
                    <span className="shrink-0 text-xs font-medium text-zinc-500">
                      {b.enrolledCount}/{b.capacity}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StudentDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'student'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<any>>('/dashboard/student');
      return res.data.data;
    },
  });

  if (isLoading) return <DashboardSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Your dashboard</h1>
        <p className="text-sm text-zinc-500">Upcoming classes, attendance, and dues at a glance.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Active courses" value={String(data.activeEnrollments)} icon={BookOpen} accent="brand" />
        <StatCard label="Outstanding dues" value={formatCurrency(data.outstandingDues)} icon={Receipt} accent={data.outstandingDues > 0 ? 'warning' : 'success'} />
        <StatCard label="Upcoming sessions" value={String(data.upcomingSessions.length)} icon={CalendarDays} accent="brand" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <UpcomingSessions sessions={data.upcomingSessions} />
        <Card>
          <CardHeader>
            <CardTitle>Attendance by course</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            {data.attendanceByCourse.length === 0 ? (
              <EmptyState icon={ClipboardCheck} title="No attendance yet" message="Once classes start, your attendance will show here." />
            ) : (
              data.attendanceByCourse.map((c: any) => (
                <div key={c.courseId}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">{c.title}</span>
                    <span className="text-zinc-500">{c.percentage === null ? '—' : `${c.percentage}%`}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <div
                      className="h-full rounded-full bg-brand-500"
                      style={{ width: `${c.percentage ?? 0}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}

import { CalendarClock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { EmptyState } from '@/components/shared/EmptyState';
import type { SessionItem } from '@/types';

export function UpcomingSessions({ sessions }: { sessions: SessionItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Today's sessions</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {sessions.length === 0 ? (
          <EmptyState icon={CalendarClock} title="Nothing scheduled today" message="Enjoy the quiet — check back tomorrow." />
        ) : (
          <ul className="space-y-3">
            {sessions.map((s) => (
              <li key={s._id} className="flex items-center gap-3 rounded-xl border border-zinc-100 p-3 dark:border-zinc-800">
                <div
                  className="h-9 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: typeof s.courseId === 'object' ? s.courseId.coverColor : '#6366F1' }}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {typeof s.courseId === 'object' ? s.courseId.title : s.title}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {new Date(s.startTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} &middot;{' '}
                    {s.enrolledCount}/{s.capacity} enrolled
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

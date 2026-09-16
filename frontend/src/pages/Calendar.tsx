import { useMemo, useState } from 'react';
import { Calendar, dateFnsLocalizer, type View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { CalendarDays, Clock, Users } from 'lucide-react';
import { useSessions } from '@/hooks/useSessions';
import { SlideOver } from '@/components/ui/SlideOver';
import { StatusPill } from '@/components/ui/StatusPill';
import { Card } from '@/components/ui/Card';
import type { SessionItem } from '@/types';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales,
});

export default function CalendarPage() {
  const [view, setView] = useState<View>('week');
  const [selected, setSelected] = useState<SessionItem | null>(null);
  const { data, isLoading } = useSessions({ limit: '200' });

  const events = useMemo(
    () =>
      (data?.sessions || []).map((s) => ({
        id: s._id,
        title: typeof s.courseId === 'object' ? s.courseId.title : s.title,
        start: new Date(s.startTime),
        end: new Date(s.endTime),
        resource: s,
      })),
    [data]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Calendar</h1>
          <p className="text-sm text-zinc-500">Color-coded by course. Click a session for details.</p>
        </div>
        <div className="flex rounded-xl border border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-900">
          {(['week', 'month'] as View[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
                view === v ? 'bg-brand-600 text-white' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <Card className="p-4">
        {isLoading ? (
          <div className="flex h-[600px] items-center justify-center text-sm text-zinc-400">Loading schedule...</div>
        ) : (
          <div className="overflow-x-auto">
            <div className="classdesk-calendar min-w-[720px]" style={{ height: 650 }}>
              <Calendar
                localizer={localizer}
                events={events}
                view={view}
                onView={setView}
                views={['week', 'month']}
                startAccessor="start"
                endAccessor="end"
                onSelectEvent={(e: any) => setSelected(e.resource)}
                eventPropGetter={(event: any) => {
                  const course = event.resource.courseId;
                  const color = typeof course === 'object' ? course.coverColor : '#6366F1';
                  return {
                    style: {
                      backgroundColor: color,
                      borderRadius: 8,
                      border: 'none',
                      fontSize: 12,
                    },
                  };
                }}
                tooltipAccessor={(event: any) =>
                  `${event.title}\n${event.resource.enrolledCount}/${event.resource.capacity} enrolled`
                }
              />
            </div>
          </div>
        )}
      </Card>

      <SlideOver open={!!selected} onClose={() => setSelected(null)} title={selected ? (typeof selected.courseId === 'object' ? selected.courseId.title : selected.title) : ''}>
        {selected && (
          <div className="space-y-4">
            <StatusPill status={selected.status} />
            <div className="space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-zinc-400" />
                {new Date(selected.startTime).toLocaleString()} – {new Date(selected.endTime).toLocaleTimeString()}
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-zinc-400" />
                {selected.enrolledCount}/{selected.capacity} enrolled
              </div>
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-zinc-400" />
                Tutor: {typeof selected.tutorId === 'object' ? selected.tutorId.name : '—'}
              </div>
            </div>
          </div>
        )}
      </SlideOver>
    </div>
  );
}

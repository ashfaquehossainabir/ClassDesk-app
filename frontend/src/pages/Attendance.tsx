import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ClipboardCheck, Lock } from 'lucide-react';
import { api, extractErrorMessage } from '@/lib/api';
import { useSessions } from '@/hooks/useSessions';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusPill } from '@/components/ui/StatusPill';
import { EmptyState } from '@/components/shared/EmptyState';
import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/useToast';
import type { ApiResponse, AttendanceRecord } from '@/types';

const STATUSES: Array<AttendanceRecord['status']> = ['present', 'late', 'absent'];

export default function Attendance() {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const { data: sessionsData, isLoading: sessionsLoading } = useSessions({ sort: '-startTime', limit: '30' });
  const queryClient = useQueryClient();

  const { data: rosterData, isLoading: rosterLoading } = useQuery({
    queryKey: ['attendance', selectedSessionId],
    queryFn: async () => {
      const res = await api.get<ApiResponse<{ attendance: AttendanceRecord[] }>>(`/attendance/session/${selectedSessionId}`);
      return res.data.data.attendance;
    },
    enabled: !!selectedSessionId,
  });

  const selectedSession = sessionsData?.sessions.find((s) => s._id === selectedSessionId);

  const markMutation = useMutation({
    mutationFn: (payload: { studentId: string; status: AttendanceRecord['status'] }) =>
      api.post(`/attendance/session/${selectedSessionId}`, { entries: [payload] }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['attendance', selectedSessionId] }),
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  const bulkMutation = useMutation({
    mutationFn: () => api.post(`/attendance/session/${selectedSessionId}/bulk`, { status: 'present' }),
    onSuccess: () => {
      toast.success('All students marked present.');
      queryClient.invalidateQueries({ queryKey: ['attendance', selectedSessionId] });
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Attendance</h1>
        <p className="text-sm text-zinc-500">Select a session to mark attendance.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Sessions</CardTitle>
          </CardHeader>
          <CardContent className="max-h-[560px] space-y-1.5 overflow-y-auto pt-4">
            {sessionsLoading && <p className="text-sm text-zinc-400">Loading...</p>}
            {!sessionsLoading && sessionsData?.sessions.length === 0 && (
              <p className="text-sm text-zinc-400">No sessions found.</p>
            )}
            {sessionsData?.sessions.map((s) => (
              <button
                key={s._id}
                onClick={() => setSelectedSessionId(s._id)}
                className={cn(
                  'w-full rounded-xl border p-3 text-left text-sm transition-colors',
                  selectedSessionId === s._id
                    ? 'border-brand-300 bg-brand-50 dark:border-brand-700 dark:bg-brand-900/20'
                    : 'border-zinc-100 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50'
                )}
              >
                <p className="font-medium text-zinc-900 dark:text-zinc-50">
                  {typeof s.courseId === 'object' ? s.courseId.title : s.title}
                </p>
                <p className="text-xs text-zinc-500">{new Date(s.startTime).toLocaleString()}</p>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{selectedSession ? (typeof selectedSession.courseId === 'object' ? selectedSession.courseId.title : selectedSession.title) : 'Roster'}</CardTitle>
            {selectedSession?.attendanceLocked && (
              <span className="flex items-center gap-1 text-xs font-medium text-amber-600">
                <Lock className="h-3.5 w-3.5" /> Locked
              </span>
            )}
          </CardHeader>
          <CardContent className="pt-4">
            {!selectedSessionId && (
              <EmptyState icon={ClipboardCheck} title="Pick a session" message="Choose a session on the left to mark attendance." />
            )}
            {selectedSessionId && (
              <>
                <div className="mb-4 flex justify-end">
                  <Button size="sm" variant="secondary" onClick={() => bulkMutation.mutate()} disabled={bulkMutation.isPending}>
                    Mark all present
                  </Button>
                </div>
                <div className="space-y-2">
                  {rosterLoading && <p className="text-sm text-zinc-400">Loading roster...</p>}
                  {rosterData?.map((record) => {
                    const student = typeof record.studentId === 'object' ? record.studentId : null;
                    return (
                      <div key={record._id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-100 p-3 dark:border-zinc-800">
                        <div className="flex min-w-0 items-center gap-3">
                          <Avatar name={student?.name || ''} />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">{student?.name}</p>
                            <StatusPill status={record.status} />
                          </div>
                        </div>
                        <div className="flex shrink-0 gap-1.5">
                          {STATUSES.map((status) => (
                            <button
                              key={status}
                              onClick={() => markMutation.mutate({ studentId: student?._id || '', status })}
                              className={cn(
                                'rounded-lg px-2.5 py-1 text-xs font-medium capitalize transition-colors',
                                record.status === status
                                  ? 'bg-brand-600 text-white'
                                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300'
                              )}
                            >
                              {status}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

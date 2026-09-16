import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Layers, Plus, Trash2 } from 'lucide-react';
import { api, extractErrorMessage } from '@/lib/api';
import { useBatches, useCourses } from '@/hooks/useCourses';
import { useAuthStore } from '@/store/authStore';
import { DataTable, RowAction, type Column } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/Input';
import { SlideOver } from '@/components/ui/SlideOver';
import { EmptyState } from '@/components/shared/EmptyState';
import { toast } from '@/hooks/useToast';
import type { Batch } from '@/types';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const slotSchema = z.object({
  dayOfWeek: z.coerce.number().min(0).max(6),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
});
const schema = z.object({
  courseId: z.string().min(1, 'Select a course'),
  name: z.string().min(2),
  timezone: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  capacity: z.coerce.number().int().positive(),
  recurringSlots: z.array(slotSchema).min(1, 'Add at least one weekly slot'),
});
type FormData = z.infer<typeof schema>;

export default function Batches() {
  const role = useAuthStore((s) => s.user?.role);
  const canManage = role === 'admin' || role === 'tutor';
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useBatches({ page: String(page) });
  const { data: coursesData } = useCourses({ limit: '100' });

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      capacity: 10,
      recurringSlots: [{ dayOfWeek: 1, startTime: '17:00', endTime: '18:00' }],
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'recurringSlots' });

  const createMutation = useMutation({
    mutationFn: (payload: FormData) => api.post('/batches', payload),
    onSuccess: (res) => {
      toast.success(`Batch created — ${res.data.data.sessionsGenerated} sessions scheduled.`);
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      setOpen(false);
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  const enrollMutation = useMutation({
    mutationFn: (batchId: string) => api.post('/enrollments', { batchId }),
    onSuccess: (res) => {
      toast.success(res.data.message);
      queryClient.invalidateQueries({ queryKey: ['batches'] });
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  function openCreate() {
    reset({
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      capacity: 10,
      recurringSlots: [{ dayOfWeek: 1, startTime: '17:00', endTime: '18:00' }],
      courseId: '',
      name: '',
      startDate: '',
      endDate: '',
    });
    setOpen(true);
  }

  const columns: Column<Batch>[] = [
    {
      key: 'name',
      header: 'Batch',
      render: (b) => (
        <div>
          <p className="font-medium text-zinc-900 dark:text-zinc-50">{b.name}</p>
          <p className="text-xs text-zinc-400">{typeof b.courseId === 'object' ? b.courseId.title : ''}</p>
        </div>
      ),
    },
    {
      key: 'slots',
      header: 'Weekly slots',
      render: (b) => b.recurringSlots.map((s) => `${DAYS[s.dayOfWeek]} ${s.startTime}`).join(', '),
    },
    { key: 'tutor', header: 'Tutor', render: (b) => (typeof b.tutorId === 'object' ? b.tutorId.name : '—') },
    {
      key: 'capacity',
      header: 'Enrolled',
      render: (b) => (
        <span className={b.enrolledCount >= b.capacity ? 'font-medium text-amber-600' : ''}>
          {b.enrolledCount}/{b.capacity}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Batches</h1>
          <p className="text-sm text-zinc-500">Recurring weekly class groups.</p>
        </div>
        {canManage && (
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> New batch
          </Button>
        )}
      </div>

      {!isLoading && data?.batches.length === 0 ? (
        <EmptyState icon={Layers} title="No batches yet" message="Create a batch to start generating sessions." ctaLabel={canManage ? 'New batch' : undefined} onCta={canManage ? openCreate : undefined} />
      ) : (
        <DataTable
          columns={columns}
          rows={data?.batches || []}
          meta={data?.meta}
          onPageChange={setPage}
          isLoading={isLoading}
          rowActions={(row) =>
            role === 'student' ? (
              <RowAction label={row.enrolledCount >= row.capacity ? 'Join waitlist' : 'Enroll'} onClick={() => enrollMutation.mutate(row._id)} />
            ) : (
              <RowAction label="View sessions" onClick={() => {}} />
            )
          }
        />
      )}

      <SlideOver open={open} onClose={() => setOpen(false)} title="New batch" subtitle="Sessions are auto-generated from the weekly pattern.">
        <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
          <div>
            <Label>Course</Label>
            <select
              {...register('courseId')}
              className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm focus-ring dark:border-zinc-700 dark:bg-zinc-900"
            >
              <option value="">Select a course</option>
              {coursesData?.courses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.title}
                </option>
              ))}
            </select>
            {errors.courseId && <p className="mt-1 text-xs text-red-600">{errors.courseId.message}</p>}
          </div>
          <div>
            <Label>Batch name</Label>
            <Input {...register('name')} placeholder="Batch A — Evenings" />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Start date</Label>
              <Input type="date" {...register('startDate')} />
            </div>
            <div>
              <Label>End date</Label>
              <Input type="date" {...register('endDate')} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Timezone</Label>
              <Input {...register('timezone')} placeholder="America/New_York" />
            </div>
            <div>
              <Label>Capacity</Label>
              <Input type="number" {...register('capacity')} />
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label className="mb-0">Weekly slots</Label>
              <Button type="button" size="sm" variant="outline" onClick={() => append({ dayOfWeek: 1, startTime: '17:00', endTime: '18:00' })}>
                <Plus className="h-3.5 w-3.5" /> Add slot
              </Button>
            </div>
            <div className="space-y-2">
              {fields.map((field, index) => (
                <div key={field.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-zinc-100 p-2 dark:border-zinc-800 sm:flex-nowrap sm:border-0 sm:p-0">
                  <select
                    {...register(`recurringSlots.${index}.dayOfWeek` as const)}
                    className="h-9 w-full shrink-0 rounded-xl border border-zinc-200 bg-white px-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 sm:w-auto"
                  >
                    {DAYS.map((d, i) => (
                      <option key={d} value={i}>
                        {d}
                      </option>
                    ))}
                  </select>
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <Input type="time" className="h-9 min-w-0 flex-1" {...register(`recurringSlots.${index}.startTime` as const)} />
                    <span className="shrink-0 text-zinc-400">–</span>
                    <Input type="time" className="h-9 min-w-0 flex-1" {...register(`recurringSlots.${index}.endTime` as const)} />
                    <button type="button" onClick={() => remove(index)} className="shrink-0 rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {errors.recurringSlots && <p className="mt-1 text-xs text-red-600">{errors.recurringSlots.message as string}</p>}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create batch'}
            </Button>
          </div>
        </form>
      </SlideOver>
    </div>
  );
}

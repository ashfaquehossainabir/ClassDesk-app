import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BookOpen, Plus } from 'lucide-react';
import { api, extractErrorMessage } from '@/lib/api';
import { useCourses } from '@/hooks/useCourses';
import { useAuthStore } from '@/store/authStore';
import { DataTable, RowAction, type Column } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/Input';
import { SlideOver } from '@/components/ui/SlideOver';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatCurrency, cn } from '@/lib/utils';
import { toast } from '@/hooks/useToast';
import type { Course } from '@/types';

const schema = z.object({
  title: z.string().min(2),
  subject: z.string().min(2),
  description: z.string().optional(),
  pricingType: z.enum(['per_session', 'monthly']),
  price: z.coerce.number().nonnegative(),
  capacity: z.coerce.number().int().positive(),
  coverColor: z.string().default('#6366F1'),
});
type FormData = z.infer<typeof schema>;

const colorOptions = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#0EA5E9', '#8B5CF6'];

export default function Courses() {
  const role = useAuthStore((s) => s.user?.role);
  const canManage = role === 'admin' || role === 'tutor';
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useCourses({ page: String(page), search });

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { pricingType: 'monthly', coverColor: colorOptions[0] },
  });

  const saveMutation = useMutation({
    mutationFn: (payload: FormData) =>
      editing ? api.patch(`/courses/${editing._id}`, payload) : api.post('/courses', payload),
    onSuccess: () => {
      toast.success(editing ? 'Course updated.' : 'Course created.');
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      closeDrawer();
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/courses/${id}`),
    onSuccess: () => {
      toast.success('Course deleted.');
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  function openCreate() {
    setEditing(null);
    reset({ pricingType: 'monthly', coverColor: colorOptions[0], title: '', subject: '', description: '', price: 0, capacity: 10 });
    setOpen(true);
  }

  function openEdit(course: Course) {
    setEditing(course);
    reset({
      title: course.title,
      subject: course.subject,
      description: course.description,
      pricingType: course.pricingType,
      price: course.price,
      capacity: course.capacity,
      coverColor: course.coverColor,
    });
    setOpen(true);
  }

  function closeDrawer() {
    setOpen(false);
    setEditing(null);
  }

  const columns: Column<Course>[] = [
    {
      key: 'title',
      header: 'Course',
      render: (c) => (
        <div className="flex items-center gap-2.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.coverColor }} />
          <div>
            <p className="font-medium text-zinc-900 dark:text-zinc-50">{c.title}</p>
            <p className="text-xs text-zinc-400">{c.subject}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'tutor',
      header: 'Tutor',
      render: (c) => (typeof c.tutorId === 'object' ? c.tutorId.name : '—'),
    },
    {
      key: 'price',
      header: 'Price',
      render: (c) => `${formatCurrency(c.price, c.currency)} ${c.pricingType === 'monthly' ? '/mo' : '/session'}`,
    },
    { key: 'capacity', header: 'Capacity', render: (c) => `${c.capacity} seats` },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {canManage ? 'Courses' : 'Browse courses'}
          </h1>
          <p className="text-sm text-zinc-500">{canManage ? 'Manage your course catalog.' : 'Find a course and enroll in a batch.'}</p>
        </div>
        {canManage && (
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> New course
          </Button>
        )}
      </div>

      {!isLoading && data?.courses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No courses yet"
          message="Create your first course to start scheduling batches."
          ctaLabel={canManage ? 'New course' : undefined}
          onCta={canManage ? openCreate : undefined}
        />
      ) : (
        <DataTable
          columns={columns}
          rows={data?.courses || []}
          meta={data?.meta}
          onPageChange={setPage}
          onSearch={(v) => {
            setSearch(v);
            setPage(1);
          }}
          searchPlaceholder="Search courses..."
          isLoading={isLoading}
          rowActions={
            canManage
              ? (row) => (
                  <>
                    <RowAction label="Edit" onClick={() => openEdit(row)} />
                    <RowAction label="Delete" danger onClick={() => deleteMutation.mutate(row._id)} />
                  </>
                )
              : undefined
          }
        />
      )}

      <SlideOver open={open} onClose={closeDrawer} title={editing ? 'Edit course' : 'New course'} subtitle="Courses group batches, pricing, and capacity.">
        <form onSubmit={handleSubmit((d) => saveMutation.mutate(d))} className="space-y-4">
          <div>
            <Label>Title</Label>
            <Input {...register('title')} placeholder="Algebra Foundations" />
            {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>}
          </div>
          <div>
            <Label>Subject</Label>
            <Input {...register('subject')} placeholder="Mathematics" />
            {errors.subject && <p className="mt-1 text-xs text-red-600">{errors.subject.message}</p>}
          </div>
          <div>
            <Label>Description</Label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full rounded-xl border border-zinc-200 bg-white p-3 text-sm focus-ring dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Pricing type</Label>
              <select
                {...register('pricingType')}
                className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm focus-ring dark:border-zinc-700 dark:bg-zinc-900"
              >
                <option value="monthly">Monthly</option>
                <option value="per_session">Per session</option>
              </select>
            </div>
            <div>
              <Label>Price (USD)</Label>
              <Input type="number" step="0.01" {...register('price')} />
            </div>
          </div>
          <div>
            <Label>Capacity</Label>
            <Input type="number" {...register('capacity')} />
            {errors.capacity && <p className="mt-1 text-xs text-red-600">{errors.capacity.message}</p>}
          </div>
          <div>
            <Label>Color</Label>
            <div className="flex gap-2">
              {colorOptions.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setValue('coverColor', c)}
                  className={cn('h-7 w-7 rounded-full border-2', watch('coverColor') === c ? 'border-zinc-900 dark:border-zinc-50' : 'border-transparent')}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={closeDrawer}>
              Cancel
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving...' : editing ? 'Save changes' : 'Create course'}
            </Button>
          </div>
        </form>
      </SlideOver>
    </div>
  );
}

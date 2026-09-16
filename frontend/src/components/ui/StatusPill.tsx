import { cn } from '@/lib/utils';

const statusStyles: Record<string, string> = {
  paid: 'bg-success-bg text-success-text',
  present: 'bg-success-bg text-success-text',
  active: 'bg-success-bg text-success-text',
  completed: 'bg-success-bg text-success-text',
  pending: 'bg-warning-bg text-warning-text',
  late: 'bg-warning-bg text-warning-text',
  waitlisted: 'bg-warning-bg text-warning-text',
  overdue: 'bg-danger-bg text-danger-text',
  absent: 'bg-danger-bg text-danger-text',
  cancelled: 'bg-danger-bg text-danger-text',
  scheduled: 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300',
  unmarked: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400',
  void: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400',
};

export function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize',
        statusStyles[status] || 'bg-zinc-100 text-zinc-600'
      )}
    >
      {status}
    </span>
  );
}

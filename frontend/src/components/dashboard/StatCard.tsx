import type { LucideIcon } from 'lucide-react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  accent = 'brand',
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  trend?: number | null;
  accent?: 'brand' | 'success' | 'warning' | 'danger';
}) {
  const accentClasses: Record<string, string> = {
    brand: 'bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300',
    success: 'bg-success-bg text-success-text',
    warning: 'bg-warning-bg text-warning-text',
    danger: 'bg-danger-bg text-danger-text',
  };

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">{value}</p>
        </div>
        <div className={cn('flex h-9 w-9 items-center justify-center rounded-xl', accentClasses[accent])}>
          <Icon className="h-4.5 w-4.5" />
        </div>
      </div>
      {trend !== undefined && trend !== null && (
        <div className={cn('mt-3 flex items-center gap-1 text-xs font-medium', trend >= 0 ? 'text-success-text' : 'text-danger-text')}>
          {trend >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
          {Math.abs(trend)}% vs last month
        </div>
      )}
    </Card>
  );
}

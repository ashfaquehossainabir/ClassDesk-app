import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function EmptyState({
  icon: Icon,
  title,
  message,
  ctaLabel,
  onCta,
}: {
  icon: LucideIcon;
  title: string;
  message: string;
  ctaLabel?: string;
  onCta?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 py-16 text-center dark:border-zinc-800">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{title}</h3>
      <p className="mt-1 max-w-xs text-sm text-zinc-500">{message}</p>
      {ctaLabel && onCta && (
        <Button className="mt-4" size="sm" onClick={onCta}>
          {ctaLabel}
        </Button>
      )}
    </div>
  );
}

import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus-ring dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50',
        className
      )}
      {...props}
    />
  )
);
Input.displayName = 'Input';

export const Label = ({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) => (
  <label className={cn('mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300', className)} {...props} />
);

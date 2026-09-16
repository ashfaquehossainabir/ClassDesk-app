import { Activity } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { EmptyState } from '@/components/shared/EmptyState';

export function ActivityFeed({ items }: { items: Array<{ id: string; message: string; at: string }> }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent activity</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {items.length === 0 ? (
          <EmptyState icon={Activity} title="No activity yet" message="Payments and enrollments will show up here." />
        ) : (
          <ul className="space-y-4">
            {items.map((item) => (
              <li key={item.id} className="flex items-start gap-3 text-sm">
                <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                <div>
                  <p className="text-zinc-700 dark:text-zinc-300">{item.message}</p>
                  <p className="text-xs text-zinc-400">{new Date(item.at).toLocaleString()}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

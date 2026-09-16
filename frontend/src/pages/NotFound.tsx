import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 text-center dark:bg-zinc-950">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300">
        <Compass className="h-6 w-6" />
      </div>
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Page not found</h1>
      <p className="mt-1 text-sm text-zinc-500">The page you're looking for doesn't exist.</p>
      <Link to="/">
        <Button className="mt-6">Back to dashboard</Button>
      </Link>
    </div>
  );
}

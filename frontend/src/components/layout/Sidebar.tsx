import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  Layers,
  CalendarDays,
  Users,
  ClipboardCheck,
  Receipt,
  GraduationCap,
  X,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';

const navByRole: Record<string, Array<{ to: string; label: string; icon: any }>> = {
  admin: [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/courses', label: 'Courses', icon: BookOpen },
    { to: '/batches', label: 'Batches', icon: Layers },
    { to: '/calendar', label: 'Calendar', icon: CalendarDays },
    { to: '/students', label: 'Students', icon: Users },
    { to: '/attendance', label: 'Attendance', icon: ClipboardCheck },
    { to: '/invoices', label: 'Invoices', icon: Receipt },
  ],
  tutor: [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/courses', label: 'My Courses', icon: BookOpen },
    { to: '/batches', label: 'Batches', icon: Layers },
    { to: '/calendar', label: 'Calendar', icon: CalendarDays },
    { to: '/attendance', label: 'Attendance', icon: ClipboardCheck },
  ],
  student: [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/courses', label: 'Browse Courses', icon: BookOpen },
    { to: '/batches', label: 'Enroll in a Batch', icon: Layers },
    { to: '/calendar', label: 'My Schedule', icon: CalendarDays },
    { to: '/invoices', label: 'Payments', icon: Receipt },
  ],
};

export function Sidebar({ mobileOpen, onCloseMobile }: { mobileOpen: boolean; onCloseMobile: () => void }) {
  const user = useAuthStore((s) => s.user);
  const items = navByRole[user?.role || 'student'];

  return (
    <>
      {mobileOpen && <div className="fixed inset-0 z-40 bg-zinc-950/40 lg:hidden" onClick={onCloseMobile} />}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 -translate-x-full flex-col border-r border-zinc-200 bg-white transition-transform duration-200 dark:border-zinc-800 dark:bg-zinc-900 lg:static lg:translate-x-0',
          mobileOpen && 'translate-x-0'
        )}
      >
        <div className="flex h-14 items-center justify-between px-5">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-white">
              <GraduationCap className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">ClassDesk</span>
          </div>
          <button onClick={onCloseMobile} className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 lg:hidden dark:hover:bg-zinc-800">
            <X className="h-4 w-4" />
          </button>
        </div>
        <nav className="flex-1 space-y-0.5 px-3 py-2">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
                    : 'text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800'
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-zinc-100 p-4 text-xs text-zinc-400 dark:border-zinc-800">
          Signed in as <span className="font-medium capitalize text-zinc-600 dark:text-zinc-300">{user?.role}</span>
        </div>
      </aside>
    </>
  );
}

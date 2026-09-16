import { useState } from 'react';
import { Bell, Menu, Moon, Search, Sun } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Avatar } from '@/components/ui/Avatar';
import { useAuthStore } from '@/store/authStore';
import { useLogout } from '@/hooks/useAuth';
import type { ApiResponse, Notification } from '@/types';

export function Topbar({ onOpenMobile }: { onOpenMobile: () => void }) {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const [dark, setDark] = useState(document.documentElement.classList.contains('dark'));
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const { data } = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<{ notifications: Notification[]; unreadCount: number }>>('/notifications', {
        params: { limit: '6' },
      });
      return res.data.data;
    },
    refetchInterval: 60_000,
  });

  function toggleDark() {
    document.documentElement.classList.toggle('dark');
    setDark(!dark);
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-zinc-200 bg-white/80 px-4 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80">
      <button onClick={onOpenMobile} className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 lg:hidden dark:hover:bg-zinc-800">
        <Menu className="h-5 w-5" />
      </button>

      <div className="relative hidden max-w-xs flex-1 sm:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          placeholder="Search..."
          className="h-9 w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-9 pr-3 text-sm focus-ring dark:border-zinc-700 dark:bg-zinc-800"
        />
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <button onClick={toggleDark} className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800">
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        <div className="relative">
          <button
            onClick={() => setNotifOpen((o) => !o)}
            className="relative rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <Bell className="h-4 w-4" />
            {(data?.unreadCount || 0) > 0 && (
              <span className="absolute right-1 top-1 flex h-2 w-2 rounded-full bg-brand-600" />
            )}
          </button>
          {notifOpen && (
            <div className="absolute right-0 top-11 w-80 rounded-2xl border border-zinc-200 bg-white p-2 shadow-card dark:border-zinc-800 dark:bg-zinc-900">
              <p className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-400">Notifications</p>
              {(data?.notifications || []).length === 0 && (
                <p className="px-2 py-4 text-center text-sm text-zinc-400">You're all caught up.</p>
              )}
              {(data?.notifications || []).map((n) => (
                <div key={n._id} className="rounded-xl px-2 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800">
                  <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">{n.title}</p>
                  <p className="text-xs text-zinc-500">{n.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <button onClick={() => setMenuOpen((o) => !o)} className="flex items-center gap-2 rounded-xl p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800">
            <Avatar name={user?.name || ''} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-12 w-48 rounded-2xl border border-zinc-200 bg-white p-1 shadow-card dark:border-zinc-800 dark:bg-zinc-900">
              <div className="px-3 py-2">
                <p className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-100">{user?.name}</p>
                <p className="truncate text-xs text-zinc-400">{user?.email}</p>
              </div>
              <button
                onClick={() => logout.mutate()}
                className="block w-full rounded-lg px-3 py-1.5 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
              >
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

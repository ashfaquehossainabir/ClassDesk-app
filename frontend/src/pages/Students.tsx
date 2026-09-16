import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users } from 'lucide-react';
import { api } from '@/lib/api';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/shared/EmptyState';
import type { ApiResponse, PaginationMeta, User } from '@/types';

export default function Students() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['users', 'student', page, search],
    queryFn: async () => {
      const res = await api.get<ApiResponse<{ users: User[]; meta: PaginationMeta }>>('/users', {
        params: { role: 'student', page: String(page), search },
      });
      return res.data.data;
    },
  });

  const columns: Column<User>[] = [
    {
      key: 'name',
      header: 'Student',
      render: (u) => (
        <div className="flex items-center gap-3">
          <Avatar name={u.name} />
          <div>
            <p className="font-medium text-zinc-900 dark:text-zinc-50">{u.name}</p>
            <p className="text-xs text-zinc-400">{u.email}</p>
          </div>
        </div>
      ),
    },
    { key: 'phone', header: 'Phone', render: (u) => u.phone || '—' },
    { key: 'joined', header: 'Joined', render: (u) => new Date(u.createdAt).toLocaleDateString() },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Students</h1>
        <p className="text-sm text-zinc-500">Everyone enrolled across your courses.</p>
      </div>

      {!isLoading && data?.users.length === 0 ? (
        <EmptyState icon={Users} title="No students yet" message="Students will appear here once they sign up or get enrolled." />
      ) : (
        <DataTable
          columns={columns}
          rows={data?.users || []}
          meta={data?.meta}
          onPageChange={setPage}
          onSearch={(v) => {
            setSearch(v);
            setPage(1);
          }}
          searchPlaceholder="Search students..."
          isLoading={isLoading}
        />
      )}
    </div>
  );
}

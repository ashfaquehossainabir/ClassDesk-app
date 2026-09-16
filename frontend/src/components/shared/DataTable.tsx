import { useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight, MoreVertical, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PaginationMeta } from '@/types';

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  sortable?: boolean;
}

export function DataTable<T extends { _id: string }>({
  columns,
  rows,
  meta,
  onPageChange,
  onSearch,
  searchPlaceholder = 'Search...',
  rowActions,
  isLoading,
}: {
  columns: Column<T>[];
  rows: T[];
  meta?: PaginationMeta;
  onPageChange?: (page: number) => void;
  onSearch?: (value: string) => void;
  searchPlaceholder?: string;
  rowActions?: (row: T) => ReactNode;
  isLoading?: boolean;
}) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-soft dark:border-zinc-800 dark:bg-zinc-900">
      {onSearch && (
        <div className="flex items-center gap-2 border-b border-zinc-100 p-3 dark:border-zinc-800">
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              onChange={(e) => onSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-9 w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-9 pr-3 text-sm focus-ring dark:border-zinc-700 dark:bg-zinc-800"
            />
          </div>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-100 text-xs uppercase tracking-wide text-zinc-400 dark:border-zinc-800">
              {columns.map((col) => (
                <th key={col.key} className="whitespace-nowrap px-5 py-3 font-medium">
                  {col.header}
                </th>
              ))}
              {rowActions && <th className="w-10 px-5 py-3" />}
            </tr>
          </thead>
          <tbody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-zinc-50 dark:border-zinc-800/50">
                  {columns.map((col) => (
                    <td key={col.key} className="px-5 py-3.5">
                      <div className="h-4 w-24 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
                    </td>
                  ))}
                  {rowActions && <td />}
                </tr>
              ))}
            {!isLoading &&
              rows.map((row) => (
                <tr
                  key={row._id}
                  className="border-b border-zinc-50 transition-colors hover:bg-zinc-50/70 dark:border-zinc-800/50 dark:hover:bg-zinc-800/40"
                >
                  {columns.map((col) => (
                    <td key={col.key} className="whitespace-nowrap px-5 py-3.5 text-zinc-700 dark:text-zinc-300">
                      {col.render(row)}
                    </td>
                  ))}
                  {rowActions && (
                    <td className="relative px-5 py-3.5 text-right">
                      <button
                        onClick={() => setOpenMenuId(openMenuId === row._id ? null : row._id)}
                        className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                      {openMenuId === row._id && (
                        <div
                          className="absolute right-5 top-10 z-10 w-40 rounded-xl border border-zinc-200 bg-white p-1 shadow-card dark:border-zinc-800 dark:bg-zinc-900"
                          onClick={() => setOpenMenuId(null)}
                        >
                          {rowActions(row)}
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
          </tbody>
        </table>
        {!isLoading && rows.length === 0 && (
          <div className="py-12 text-center text-sm text-zinc-400">No results found.</div>
        )}
      </div>
      {meta && onPageChange && (
        <div className="flex items-center justify-between border-t border-zinc-100 px-5 py-3 text-sm text-zinc-500 dark:border-zinc-800">
          <span>
            Page {meta.page} of {meta.totalPages} &middot; {meta.total} total
          </span>
          <div className="flex gap-1">
            <button
              disabled={!meta.hasPrevPage}
              onClick={() => onPageChange(meta.page - 1)}
              className={cn('rounded-lg p-1.5 hover:bg-zinc-100 disabled:opacity-40 dark:hover:bg-zinc-800')}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              disabled={!meta.hasNextPage}
              onClick={() => onPageChange(meta.page + 1)}
              className={cn('rounded-lg p-1.5 hover:bg-zinc-100 disabled:opacity-40 dark:hover:bg-zinc-800')}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function RowAction({ label, onClick, danger }: { label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'block w-full rounded-lg px-3 py-1.5 text-left text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800',
        danger ? 'text-red-600' : 'text-zinc-700 dark:text-zinc-300'
      )}
    >
      {label}
    </button>
  );
}

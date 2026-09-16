import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { ApiResponse, PaginationMeta, SessionItem } from '@/types';

export function useSessions(params: Record<string, string> = {}) {
  return useQuery({
    queryKey: ['sessions', params],
    queryFn: async () => {
      const res = await api.get<ApiResponse<{ sessions: SessionItem[]; meta: PaginationMeta }>>('/sessions', { params });
      return res.data.data;
    },
  });
}

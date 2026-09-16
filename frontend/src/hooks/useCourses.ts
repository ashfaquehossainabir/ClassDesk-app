import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { ApiResponse, Course, PaginationMeta } from '@/types';

export function useCourses(params: Record<string, string> = {}) {
  return useQuery({
    queryKey: ['courses', params],
    queryFn: async () => {
      const res = await api.get<ApiResponse<{ courses: Course[]; meta: PaginationMeta }>>('/courses', { params });
      return res.data.data;
    },
  });
}

export function useBatches(params: Record<string, string> = {}) {
  return useQuery({
    queryKey: ['batches', params],
    queryFn: async () => {
      const res = await api.get<ApiResponse<{ batches: any[]; meta: PaginationMeta }>>('/batches', { params });
      return res.data.data;
    },
  });
}

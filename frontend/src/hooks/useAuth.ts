import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api, extractErrorMessage } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import type { ApiResponse, User } from '@/types';

export function useCurrentUser() {
  const setUser = useAuthStore((s) => s.setUser);
  const setLoading = useAuthStore((s) => s.setLoading);

  const query = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<{ user: User }>>('/auth/me');
      return res.data.data.user;
    },
    retry: false,
  });

  useEffect(() => {
    setLoading(query.isLoading);
    if (query.data) setUser(query.data);
    if (query.isError) setUser(null);
  }, [query.data, query.isError, query.isLoading, setLoading, setUser]);

  return query;
}

export function useLogin() {
  const setUser = useAuthStore((s) => s.setUser);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { email: string; password: string }) => {
      const res = await api.post<ApiResponse<{ user: User }>>('/auth/login', payload);
      return res.data.data.user;
    },
    onSuccess: (user) => {
      setUser(user);
      queryClient.invalidateQueries();
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });
}

export function useSignup() {
  const setUser = useAuthStore((s) => s.setUser);

  return useMutation({
    mutationFn: async (payload: { name: string; email: string; password: string; role: string }) => {
      const res = await api.post<ApiResponse<{ user: User }>>('/auth/signup', payload);
      return res.data.data.user;
    },
    onSuccess: (user) => {
      setUser(user);
      toast.success('Account created — welcome to ClassDesk!');
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });
}

export function useLogout() {
  const setUser = useAuthStore((s) => s.setUser);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.post('/auth/logout'),
    onSuccess: () => {
      setUser(null);
      queryClient.clear();
    },
  });
}

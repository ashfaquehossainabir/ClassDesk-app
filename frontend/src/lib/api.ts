import axios from 'axios';

// In local dev, Vite's dev server proxies `/api` to the backend (see
// vite.config.ts), so the relative path works. In production the frontend
// (Vercel) and backend (Render) are on entirely different domains, so a
// relative baseURL would just hit Vercel's own domain and 404 — it must
// point at the deployed backend URL instead, set via VITE_API_URL.
const baseURL = import.meta.env.VITE_API_URL || '/api/v1';

export const api = axios.create({
  baseURL,
  withCredentials: true,
});

let isRefreshing = false;
let queue: Array<() => void> = [];

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry && !original.url?.includes('/auth/')) {
      original._retry = true;

      if (isRefreshing) {
        await new Promise<void>((resolve) => queue.push(resolve));
        return api(original);
      }

      isRefreshing = true;
      try {
        await api.post('/auth/refresh');
        queue.forEach((resolve) => resolve());
        queue = [];
        return api(original);
      } catch (refreshError) {
        queue = [];
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export function extractErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.message || err.message || 'Something went wrong.';
  }
  return 'Something went wrong.';
}

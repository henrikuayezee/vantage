import axios, { type InternalAxiosRequestConfig, type AxiosError } from 'axios';
import { useAuthStore } from '@/stores/auth-store';

interface RefreshResponse {
  accessToken: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    organizationId: string;
    avatarUrl?: string | null;
  };
}

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001',
  withCredentials: true, // needed for refresh-token httpOnly cookie
  headers: { 'Content-Type': 'application/json' },
});

// Attach access token from in-memory store to every request
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401: try to refresh, then retry once
let refreshing: Promise<void> | null = null;

apiClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const isRefreshCall = (original.url ?? '').includes('/auth/refresh');
    if (error.response?.status === 401 && !original._retry && !isRefreshCall) {
      original._retry = true;
      if (!refreshing) {
        refreshing = apiClient
          .post<RefreshResponse>('/auth/refresh')
          .then(({ data }) => {
            useAuthStore.getState().setAccessToken(data.accessToken);
            if (data.user) useAuthStore.getState().setUser(data.user);
          })
          .catch(() => {
            useAuthStore.getState().clearAuth();
          })
          .finally(() => {
            refreshing = null;
          });
      }
      await refreshing;
      const newToken = useAuthStore.getState().accessToken;
      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(original);
      }
    }
    return Promise.reject(error);
  },
);

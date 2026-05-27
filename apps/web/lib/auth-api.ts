import { apiClient } from './api-client';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  organizationId: string;
  avatarUrl?: string | null;
  isActive: boolean;
  createdAt: string;
}

export const authApi = {
  login: (data: LoginPayload) => apiClient.post<AuthResponse>('/auth/login', data),
  refresh: () => apiClient.post<AuthResponse>('/auth/refresh'),
  logout: () => apiClient.post('/auth/logout'),
  forgotPassword: (email: string) => apiClient.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) =>
    apiClient.post('/auth/reset-password', { token, password }),
  acceptInvite: (token: string, password: string, firstName: string, lastName: string) =>
    apiClient.post<AuthResponse>('/auth/accept-invite', { token, password, firstName, lastName }),
};

export const usersApi = {
  me: () => apiClient.get<UserProfile>('/users/me'),
  updateProfile: (data: Partial<UserProfile & { currentPassword: string; newPassword: string }>) =>
    apiClient.patch<UserProfile>('/users/me', data),
  list: (page = 1, limit = 20) =>
    apiClient.get<{ data: UserProfile[]; total: number; page: number; limit: number }>(
      `/users?page=${page}&limit=${limit}`,
    ),
  invite: (email: string, role?: string) => apiClient.post('/users/invite', { email, role }),
  updateUser: (id: string, data: { role?: string; isActive?: boolean }) =>
    apiClient.patch<UserProfile>(`/users/${id}`, data),
  deleteUser: (id: string) => apiClient.delete(`/users/${id}`),
};

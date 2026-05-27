import { apiClient } from './api-client';
import type { ProjectStatus, Role } from '@vantage/types';

export interface ProjectMember {
  id: string;
  role: string;
  userId: string;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl?: string | null;
    role: string;
  };
}

export interface Project {
  id: string;
  key?: string | null;
  name: string;
  description?: string | null;
  status: ProjectStatus;
  startDate?: string | null;
  endDate?: string | null;
  createdAt: string;
  updatedAt: string;
  organizationId: string;
  members: ProjectMember[];
  progress: number;
}

export interface ProjectStats {
  total: number;
  progress: number;
  counts: Record<string, number>;
}

export interface CreateProjectPayload {
  name: string;
  key?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
}

export interface UpdateProjectPayload {
  name?: string;
  description?: string;
  startDate?: string | null;
  endDate?: string | null;
  status?: ProjectStatus;
}

export const projectsApi = {
  list: () => apiClient.get<Project[]>('/projects'),

  getById: (id: string) => apiClient.get<Project>(`/projects/${id}`),

  create: (data: CreateProjectPayload) => apiClient.post<Project>('/projects', data),

  update: (id: string, data: UpdateProjectPayload) =>
    apiClient.patch<Project>(`/projects/${id}`, data),

  archive: (id: string) => apiClient.patch<Project>(`/projects/${id}/archive`, {}),

  delete: (id: string) => apiClient.delete(`/projects/${id}`),

  addMember: (id: string, userId: string, role?: Role) =>
    apiClient.post(`/projects/${id}/members`, { userId, role }),

  removeMember: (id: string, userId: string) =>
    apiClient.delete(`/projects/${id}/members/${userId}`),

  getStats: (id: string) => apiClient.get<ProjectStats>(`/projects/${id}/stats`),
};

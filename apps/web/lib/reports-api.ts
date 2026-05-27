import { apiClient } from './api-client';

export interface OverviewReport {
  tasksByStatus: { status: string; count: number }[];
  tasksByPriority: { priority: string; count: number }[];
  completionTrend: { week: string; completed: number }[];
}

export interface TeamMember {
  id: string;
  name: string;
  avatarUrl?: string | null;
  role: string;
  open: number;
  completed: number;
}

export interface ProjectReport {
  id: string;
  name: string;
  status: string;
  total: number;
  done: number;
  progress: number;
  overdue: number;
}

export const reportsApi = {
  getOverview: () => apiClient.get<OverviewReport>('/reports/overview'),
  getTeam: () => apiClient.get<TeamMember[]>('/reports/team'),
  getProjects: () => apiClient.get<ProjectReport[]>('/reports/projects'),
};

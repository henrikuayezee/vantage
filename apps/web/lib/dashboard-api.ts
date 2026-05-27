import { apiClient } from './api-client';

export interface AssignedTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  projectId: string;
  parentTaskId: string | null;
  project: { id: string; name: string };
  parentTask: { id: string; title: string } | null;
  assignee: { id: string; firstName: string; lastName: string; avatarUrl: string | null } | null;
}

export interface DeveloperData {
  assignedTasks: AssignedTask[];
  overdueCount: number;
  dueThisWeekCount: number;
  completedThisWeek: number;
}

export interface ProjectMeta {
  id: string;
  name: string;
  status: string;
  endDate: string | null;
  updatedAt: string;
  memberCount: number;
  taskCount: number;
  progress: number;
  atRisk: boolean;
}

export interface UpcomingMilestone {
  id: string;
  title: string;
  dueDate: string;
  color: string | null;
  project: { id: string; name: string };
}

export interface PmData {
  projects: ProjectMeta[];
  upcomingMilestones: UpcomingMilestone[];
  unassignedCount: number;
  completionRate: number;
  atRiskCount: number;
}

export interface AdminStats {
  totalProjects: number;
  activeProjects: number;
  totalTasks: number;
  overdueTasks: number;
  totalUsers: number;
  activeUsers: number;
  completionRate: number;
}

export interface RecentProject {
  id: string;
  name: string;
  status: string;
  updatedAt: string;
  taskCount: number;
  progress: number;
}

export interface AdminData {
  stats: AdminStats;
  recentProjects: RecentProject[];
}

export const dashboardApi = {
  getDeveloper: () => apiClient.get<DeveloperData>('/dashboard/developer'),
  getPm: () => apiClient.get<PmData>('/dashboard/pm'),
  getAdmin: () => apiClient.get<AdminData>('/dashboard/admin'),
};

import { apiClient } from './api-client';
import type { TaskStatus, Priority } from '@vantage/types';

export interface TaskUser {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  email?: string;
}

export interface Milestone {
  id: string;
  title: string;
  dueDate: string;
  color?: string | null;
  totalTasks?: number;
  doneTasks?: number;
}

export interface TaskDependency {
  id: string;
  dependsOn: { id: string; title: string; status: string };
}

export interface Task {
  id: string;
  number?: number | null;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: Priority;
  position: number;
  startDate?: string | null;
  dueDate?: string | null;
  createdAt: string;
  updatedAt: string;
  projectId: string;
  organizationId: string;
  parentTaskId?: string | null;
  milestoneId?: string | null;
  assigneeId?: string | null;
  creatorId: string;
  assignee?: TaskUser | null;
  creator: TaskUser;
  milestone?: Milestone | null;
  project?: { key?: string | null };
  _count: { subTasks: number; comments: number };
  // only on getById:
  subTasks?: Task[];
  dependencies?: TaskDependency[];
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: Priority;
  assigneeId?: string;
  parentTaskId?: string;
  milestoneId?: string;
  startDate?: string;
  dueDate?: string;
  position?: number;
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: Priority;
  assigneeId?: string | null;
  milestoneId?: string | null;
  startDate?: string | null;
  dueDate?: string | null;
  position?: number;
}

export interface TaskFilters {
  status?: string;
  priority?: string;
  assigneeId?: string;
  milestoneId?: string;
  overdue?: boolean;
  search?: string;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export interface GanttTask {
  id: string;
  title: string;
  status: TaskStatus;
  priority: Priority;
  startDate: string | null;
  dueDate: string | null;
  assignee?: TaskUser | null;
  dependencies: { dependsOnTaskId: string }[];
}

export interface GanttData {
  tasks: GanttTask[];
  milestones: Milestone[];
}

export function formatTaskId(task: Pick<Task, 'number' | 'project'>): string | null {
  if (!task.project?.key || task.number == null) return null;
  return `${task.project.key}-${String(task.number).padStart(3, '0')}`;
}

export const tasksApi = {
  list: (projectId: string, filters: TaskFilters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== '') params.set(k, String(v));
    });
    const qs = params.toString();
    return apiClient.get<Task[]>(
      `/projects/${projectId}/tasks${qs ? `?${qs}` : ''}`,
    );
  },

  getById: (projectId: string, taskId: string) =>
    apiClient.get<Task>(`/projects/${projectId}/tasks/${taskId}`),

  create: (projectId: string, data: CreateTaskPayload) =>
    apiClient.post<Task>(`/projects/${projectId}/tasks`, data),

  update: (projectId: string, taskId: string, data: UpdateTaskPayload) =>
    apiClient.patch<Task>(`/projects/${projectId}/tasks/${taskId}`, data),

  delete: (projectId: string, taskId: string) =>
    apiClient.delete(`/projects/${projectId}/tasks/${taskId}`),

  updateStatus: (projectId: string, taskId: string, status: TaskStatus) =>
    apiClient.patch<Task>(`/projects/${projectId}/tasks/${taskId}/status`, { status }),

  updatePosition: (projectId: string, taskId: string, position: number) =>
    apiClient.patch<Task>(`/projects/${projectId}/tasks/${taskId}/position`, { position }),

  getSubTasks: (projectId: string, taskId: string) =>
    apiClient.get<Task[]>(`/projects/${projectId}/tasks/${taskId}/subtasks`),

  addDependency: (projectId: string, taskId: string, dependsOnTaskId: string) =>
    apiClient.post(`/projects/${projectId}/tasks/${taskId}/dependencies`, {
      dependsOnTaskId,
    }),

  removeDependency: (projectId: string, taskId: string, dependsOnTaskId: string) =>
    apiClient.delete(
      `/projects/${projectId}/tasks/${taskId}/dependencies/${dependsOnTaskId}`,
    ),

  getGanttData: (projectId: string) =>
    apiClient.get<GanttData>(`/projects/${projectId}/gantt`),
};

export const milestonesApi = {
  list: (projectId: string) =>
    apiClient.get<Milestone[]>(`/projects/${projectId}/milestones`),

  create: (projectId: string, data: { title: string; dueDate: string; color?: string }) =>
    apiClient.post<Milestone>(`/projects/${projectId}/milestones`, data),

  update: (projectId: string, milestoneId: string, data: { title?: string; dueDate?: string; color?: string }) =>
    apiClient.patch<Milestone>(`/projects/${projectId}/milestones/${milestoneId}`, data),

  delete: (projectId: string, milestoneId: string) =>
    apiClient.delete(`/projects/${projectId}/milestones/${milestoneId}`),
};

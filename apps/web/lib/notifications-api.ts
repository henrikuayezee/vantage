import { apiClient } from './api-client';

export interface AppNotification {
  id: string;
  type: 'TASK_ASSIGNED' | 'TASK_COMMENTED' | 'TASK_DUE_SOON';
  message: string;
  isRead: boolean;
  createdAt: string;
  taskId: string | null;
  task: { id: string; title: string; projectId: string } | null;
}

export const notificationsApi = {
  getAll: () => apiClient.get<AppNotification[]>('/notifications'),
  getUnreadCount: () => apiClient.get<{ count: number }>('/notifications/unread-count'),
  markRead: (id: string) => apiClient.patch(`/notifications/${id}/read`),
  markAllRead: () => apiClient.post('/notifications/read-all'),
};

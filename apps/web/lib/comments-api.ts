import { apiClient } from './api-client';

export interface Comment {
  id: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
}

export const commentsApi = {
  list: (taskId: string) => apiClient.get<Comment[]>(`/tasks/${taskId}/comments`),
  create: (taskId: string, body: string, mentionedUserIds?: string[]) =>
    apiClient.post<Comment>(`/tasks/${taskId}/comments`, { body, mentionedUserIds }),
};

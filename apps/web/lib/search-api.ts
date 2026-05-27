import { apiClient } from './api-client';

export interface SearchProject {
  id: string;
  name: string;
  status: string;
  description: string | null;
}

export interface SearchTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  projectId: string;
  project: { id: string; name: string };
}

export interface SearchResults {
  projects: SearchProject[];
  tasks: SearchTask[];
}

export const searchApi = {
  search: (q: string) => apiClient.get<SearchResults>('/search', { params: { q } }),
};

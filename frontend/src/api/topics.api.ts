import { apiClient } from './client';

export interface Topic {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
}

export const topicsApi = {
  getAll: () =>
    apiClient.get<Topic[]>('/topics').then((r) => r.data),

  create: (data: { name: string; description?: string }) =>
    apiClient.post<Topic>('/topics', data).then((r) => r.data),

  update: (id: string, data: { name?: string; description?: string }) =>
    apiClient.patch<Topic>(`/topics/${id}`, data).then((r) => r.data),

  remove: (id: string) =>
    apiClient.delete(`/topics/${id}`).then((r) => r.data),
};

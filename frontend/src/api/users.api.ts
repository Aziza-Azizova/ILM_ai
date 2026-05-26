import { apiClient } from './client';

export interface UserStats {
  topicsCount: number;
  documentsCount: number;
  chatSessionsCount: number;
  quizSessionsCount: number;
  streak: number;
  scoreTrend: Array<{ score: number; createdAt: string }>;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  plan: string;
  goalText: string | null;
  goalDate: string | null;
  streak: number;
}

export interface UpdateGoalData {
  goalText?: string;
  goalDate?: string;
}

export interface UpdateProfileData {
  name?: string;
  reminderTime?: string;
}

export const usersApi = {
  getProfile: () =>
    apiClient.get<UserProfile>('/users/me').then((r) => r.data),

  getStats: () =>
    apiClient.get<UserStats>('/users/me/stats').then((r) => r.data),

  updateGoal: (data: UpdateGoalData) =>
    apiClient.patch<UserProfile>('/users/me/goal', data).then((r) => r.data),

  updateProfile: (data: UpdateProfileData) =>
    apiClient.patch<UserProfile>('/users/me', data).then((r) => r.data),
};

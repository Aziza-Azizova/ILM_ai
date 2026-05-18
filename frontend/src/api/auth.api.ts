import { apiClient } from './client';

export interface AuthResponse {
  accessToken: string;
  user: { id: string; email: string; name: string; plan: string };
}

export const authApi = {
  register: (data: { email: string; password: string; name?: string }) =>
    apiClient.post<AuthResponse>('/auth/register', data).then((r) => r.data),

  login: (data: { email: string; password: string }) =>
    apiClient.post<AuthResponse>('/auth/login', data).then((r) => r.data),

  googleLogin: () => {
    window.location.href = `${import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api'}/auth/google`;
  },
};

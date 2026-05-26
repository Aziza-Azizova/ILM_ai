import { apiClient } from './client';
import type { AuthUser } from '../types/auth.types';

export interface RegisterData {
  email: string;
  password: string;
  name?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

export const authApi = {
  register: (data: RegisterData) =>
    apiClient.post<AuthResponse>('/auth/register', data).then((r) => r.data),

  login: (data: LoginData) =>
    apiClient.post<AuthResponse>('/auth/login', data).then((r) => r.data),

  googleLogin: () => {
    window.location.href = `${import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api'}/auth/google`;
  },
};

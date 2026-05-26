import { create } from 'zustand';
import type { AuthUser } from '../types/auth.types';

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('ilmai_token'),
  isAuthenticated: !!localStorage.getItem('ilmai_token'),

  login: (token, user) => {
    localStorage.setItem('ilmai_token', token);
    set({ token, user, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('ilmai_token');
    set({ token: null, user: null, isAuthenticated: false });
  },
}));

import { create } from 'zustand';
import { apiClient } from '@/lib/api-client';

interface User {
  id: string;
  email: string;
  username: string;
  gender?: string;
  age?: number;
  height?: number;
  fitness_goal?: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hydrated: boolean;
  error: string | null;

  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => void;
  getCurrentUser: () => Promise<void>;
  init: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  isAuthenticated: false,
  hydrated: false,
  error: null,

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  init: async () => {
    const token = apiClient.getToken();
    if (!token) {
      set({ hydrated: true });
      return;
    }
    try {
      const user = await apiClient.get<User>('/auth/me');
      set({ user, isAuthenticated: true, hydrated: true });
    } catch {
      apiClient.clearToken();
      set({ hydrated: true });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.post<any>('/auth/login', { email, password });
      apiClient.setToken(response.access_token);
      if (response.refresh_token) {
        localStorage.setItem('refresh_token', response.refresh_token);
      }
      set({
        user: response.user,
        isAuthenticated: true,
        hydrated: true,
        isLoading: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : '登录失败';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  register: async (email, username, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.post<any>('/auth/register', {
        email,
        username,
        password,
      });
      apiClient.setToken(response.access_token);
      if (response.refresh_token) {
        localStorage.setItem('refresh_token', response.refresh_token);
      }
      set({
        user: response.user,
        isAuthenticated: true,
        hydrated: true,
        isLoading: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : '注册失败';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  logout: () => {
    apiClient.clearToken();
    set({ user: null, isAuthenticated: false, hydrated: true });
  },

  getCurrentUser: async () => {
    set({ isLoading: true });
    try {
      const user = await apiClient.get<User>('/auth/me');
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },
}));

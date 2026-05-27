'use client';

import { create } from 'zustand';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  organizationId: string;
  avatarUrl?: string | null;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: AuthUser, accessToken: string) => void;
  setUser: (user: AuthUser) => void;
  setAccessToken: (token: string) => void;
  clearAuth: () => void;
}

function setSessionCookie(value: string) {
  if (typeof document === 'undefined') return;
  document.cookie = value;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  setAuth: (user, accessToken) => {
    set({ user, accessToken, isAuthenticated: true });
    setSessionCookie('vantage_session=1; path=/; SameSite=Strict');
  },
  setUser: (user) => set({ user }),
  setAccessToken: (accessToken) => set({ accessToken }),
  clearAuth: () => {
    set({ user: null, accessToken: null, isAuthenticated: false });
    setSessionCookie('vantage_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT');
  },
}));

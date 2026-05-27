'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark';

interface UiState {
  theme: Theme;
  sidebarCollapsed: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      sidebarCollapsed: false,
      setTheme: (theme) => {
        set({ theme });
        applyTheme(theme);
      },
      toggleTheme: () => {
        const next = get().theme === 'light' ? 'dark' : 'light';
        set({ theme: next });
        applyTheme(next);
      },
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
    }),
    {
      name: 'vantage-ui',
      partialize: (s) => ({ theme: s.theme, sidebarCollapsed: s.sidebarCollapsed }),
      onRehydrateStorage: () => (state) => {
        if (state) applyTheme(state.theme);
      },
    },
  ),
);

function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('theme-dark', theme === 'dark');
}

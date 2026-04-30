import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'auto' | 'light' | 'dark';

interface ThemeState {
  mode: ThemeMode;
  effectiveTheme: 'light' | 'dark';
  setMode: (mode: ThemeMode) => void;
  initTheme: () => void;
}

function getEffectiveTheme(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'auto') {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return mode;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: 'auto',
      effectiveTheme: getEffectiveTheme('auto'),

      setMode: (mode) => {
        const effectiveTheme = getEffectiveTheme(mode);
        set({ mode, effectiveTheme });
        if (typeof document !== 'undefined') {
          document.documentElement.classList.toggle('dark', effectiveTheme === 'dark');
        }
      },

      initTheme: () => {
        const { effectiveTheme } = get();
        if (typeof document !== 'undefined') {
          document.documentElement.classList.toggle('dark', effectiveTheme === 'dark');
        }
      },
    }),
    {
      name: 'stratum-theme',
      onRehydrateStorage: () => (state) => {
        if (state) {
          setTimeout(() => {
            state.initTheme();
          }, 0);
        }
      },
    }
  )
);

// Listen for system theme changes when in auto mode
if (typeof window !== 'undefined') {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    const state = useThemeStore.getState();
    if (state.mode === 'auto') {
      const effectiveTheme = e.matches ? 'dark' : 'light';
      useThemeStore.setState({ effectiveTheme });
      document.documentElement.classList.toggle('dark', effectiveTheme === 'dark');
    }
  });
}
import { create } from 'zustand';

interface AppState {
  darkMode: boolean;
  toggleDarkMode: () => void;
  snackbar: { open: boolean; message: string; severity: 'success' | 'error' | 'info' };
  showSnackbar: (message: string, severity?: 'success' | 'error' | 'info') => void;
  hideSnackbar: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  darkMode: localStorage.getItem('darkMode') === 'true',
  toggleDarkMode: () =>
    set((state) => {
      const next = !state.darkMode;
      localStorage.setItem('darkMode', String(next));
      return { darkMode: next };
    }),
  snackbar: { open: false, message: '', severity: 'info' },
  showSnackbar: (message, severity = 'success') =>
    set({ snackbar: { open: true, message, severity } }),
  hideSnackbar: () =>
    set((state) => ({ snackbar: { ...state.snackbar, open: false } })),
}));

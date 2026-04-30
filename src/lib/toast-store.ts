import { create } from 'zustand';
import { nanoid } from 'nanoid';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastState {
  toasts: Toast[];
  addToast: (type: ToastType, message: string, duration?: number) => void;
  removeToast: (id: string) => void;
}

const DEFAULT_DURATION = 3000;
const ERROR_DURATION = 5000;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  addToast: (type, message, duration) => {
    const id = nanoid(8);
    const actualDuration = type === 'error' ? ERROR_DURATION : (duration ?? DEFAULT_DURATION);

    set((state) => ({
      toasts: [...state.toasts, { id, type, message, duration: actualDuration }],
    }));

    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, actualDuration);
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
}));

// Helper functions for easy access
export const toast = {
  success: (message: string, duration?: number) =>
    useToastStore.getState().addToast('success', message, duration),
  error: (message: string, duration?: number) =>
    useToastStore.getState().addToast('error', message, duration),
  info: (message: string, duration?: number) =>
    useToastStore.getState().addToast('info', message, duration),
};
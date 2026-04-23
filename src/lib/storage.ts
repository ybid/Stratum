import type { TaskState } from './types';
import { TaskStateSchema } from './types';

const STORAGE_KEY = 'stratum-data';

export function loadState(): TaskState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const result = TaskStateSchema.safeParse(parsed);
    if (result.success) {
      return result.data as TaskState;
    }
    console.warn('[Storage] Loaded data failed validation, using defaults');
    return null;
  } catch {
    return null;
  }
}

export function saveState(state: TaskState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('[Storage] Failed to save state:', error);
  }
}

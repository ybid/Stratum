import type { Directory, Task, ViewMode, Locale, TaskState } from '../types';

export function getDefaultState(): TaskState & { isLoading: boolean; filter: string; past: TaskState[]; future: TaskState[] } {
  return {
    directories: [],
    tasks: [],
    activeTaskId: null,
    sidebarOpen: true,
    viewMode: 'outline',
    locale: 'en',
    isLoading: true,
    filter: '',
    past: [],
    future: [],
  };
}

export const DEFAULT_COLUMNS = [
  { id: 'task', name: 'Task', type: 'text' as const, width: 300 },
];

export { type Directory, type Task, type ViewMode, type Locale, type TaskState };
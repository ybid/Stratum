import { create } from 'zustand';
import type { Directory, Task, ColumnDef, TaskRow, ViewMode, Locale, TaskState } from './types';
import { loadState, saveState } from './storage';

function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

const DEFAULT_COLUMNS: ColumnDef[] = [
  { id: 'task', name: 'Task', type: 'text', width: 300 },
];

function createDefaultRows(): TaskRow[] {
  return [{ id: generateId(), indent: 0, cells: { task: null }, collapsed: false }];
}

function getInitialState(): TaskState {
  const saved = loadState();
  if (saved && saved.directories) return saved;
  // Provide a default directory + task so the app isn't empty
  const dirId = generateId();
  const taskId = generateId();
  return {
    directories: [{ id: dirId, name: 'My Project', collapsed: false }],
    tasks: [
      { id: taskId, directoryId: dirId, name: 'Getting Started', columns: [...DEFAULT_COLUMNS], rows: createDefaultRows() },
    ],
    activeTaskId: taskId,
    sidebarOpen: true,
    viewMode: 'outline',
    locale: 'en',
  };
}

// Helper: update the active task in the tasks array
function updateActiveTask(tasks: Task[], activeTaskId: string | null, updater: (task: Task) => Task): Task[] {
  if (!activeTaskId) return tasks;
  return tasks.map((t) => (t.id === activeTaskId ? updater(t) : t));
}

interface TaskActions {
  // Directory actions
  addDirectory: (name: string) => void;
  removeDirectory: (id: string) => void;
  renameDirectory: (id: string, name: string) => void;
  toggleDirectoryCollapse: (id: string) => void;

  // Task actions
  addTask: (directoryId: string, name: string) => void;
  removeTask: (id: string) => void;
  renameTask: (id: string, name: string) => void;
  setActiveTask: (id: string) => void;

  // Sidebar
  toggleSidebar: () => void;

  // Active task row/column actions
  addColumn: (col: ColumnDef) => void;
  updateColumn: (id: string, partial: Partial<ColumnDef>) => void;
  removeColumn: (id: string) => void;
  addRow: (afterId: string | null, indent: number) => void;
  updateCell: (rowId: string, colId: string, value: string | number | boolean | null) => void;
  updateRowIndent: (rowId: string, indent: number) => void;
  removeRow: (id: string) => void;
  moveRow: (sourceId: string, targetId: string, position: 'before' | 'after' | 'child') => void;
  toggleCollapse: (id: string) => void;

  // Global
  setViewMode: (mode: ViewMode) => void;
  setLocale: (locale: Locale) => void;
}

export const useTaskStore = create<TaskState & TaskActions>()((set) => {
  function persist(state: TaskState) {
    saveState(state);
  }

  return {
    ...getInitialState(),

    // --- Directory actions ---

    addDirectory: (name) =>
      set((s) => {
        const dir: Directory = { id: generateId(), name, collapsed: false };
        const next = { ...s, directories: [...s.directories, dir] };
        persist(next);
        return next;
      }),

    removeDirectory: (id) =>
      set((s) => {
        const next = {
          ...s,
          directories: s.directories.filter((d) => d.id !== id),
          tasks: s.tasks.filter((t) => t.directoryId !== id),
          activeTaskId: s.activeTaskId && s.tasks.some((t) => t.id === s.activeTaskId && t.directoryId === id)
            ? null
            : s.activeTaskId,
        };
        persist(next);
        return next;
      }),

    renameDirectory: (id, name) =>
      set((s) => {
        const next = {
          ...s,
          directories: s.directories.map((d) => (d.id === id ? { ...d, name } : d)),
        };
        persist(next);
        return next;
      }),

    toggleDirectoryCollapse: (id) =>
      set((s) => {
        const next = {
          ...s,
          directories: s.directories.map((d) => (d.id === id ? { ...d, collapsed: !d.collapsed } : d)),
        };
        persist(next);
        return next;
      }),

    // --- Task actions ---

    addTask: (directoryId, name) => {
      const id = generateId();
      set((s) => {
        const task: Task = {
          id,
          directoryId,
          name,
          columns: DEFAULT_COLUMNS.map((c) => ({ ...c })),
          rows: createDefaultRows(),
        };
        const next = {
          ...s,
          tasks: [...s.tasks, task],
          activeTaskId: id,
        };
        persist(next);
        return next;
      });
      return id;
    },

    removeTask: (id) =>
      set((s) => {
        const next = {
          ...s,
          tasks: s.tasks.filter((t) => t.id !== id),
          activeTaskId: s.activeTaskId === id ? null : s.activeTaskId,
        };
        persist(next);
        return next;
      }),

    renameTask: (id, name) =>
      set((s) => {
        const next = {
          ...s,
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, name } : t)),
        };
        persist(next);
        return next;
      }),

    setActiveTask: (id) =>
      set((s) => {
        const next = { ...s, activeTaskId: id };
        persist(next);
        return next;
      }),

    // --- Sidebar ---

    toggleSidebar: () =>
      set((s) => {
        const next = { ...s, sidebarOpen: !s.sidebarOpen };
        persist(next);
        return next;
      }),

    // --- Active task row/column actions ---

    addColumn: (col) =>
      set((s) => {
        const next = {
          ...s,
          tasks: updateActiveTask(s.tasks, s.activeTaskId, (t) => ({
            ...t,
            columns: [...t.columns, col],
            rows: t.rows.map((r) => ({
              ...r,
              cells: { ...r.cells, [col.id]: null },
            })),
          })),
        };
        persist(next);
        return next;
      }),

    updateColumn: (id, partial) =>
      set((s) => {
        const next = {
          ...s,
          tasks: updateActiveTask(s.tasks, s.activeTaskId, (t) => ({
            ...t,
            columns: t.columns.map((c) => (c.id === id ? { ...c, ...partial } : c)),
          })),
        };
        persist(next);
        return next;
      }),

    removeColumn: (id) =>
      set((s) => {
        const next = {
          ...s,
          tasks: updateActiveTask(s.tasks, s.activeTaskId, (t) => ({
            ...t,
            columns: t.columns.filter((c) => c.id !== id),
            rows: t.rows.map((r) => {
              const cells = { ...r.cells };
              delete cells[id];
              return { ...r, cells };
            }),
          })),
        };
        persist(next);
        return next;
      }),

    addRow: (afterId, indent) =>
      set((s) => {
        const next = {
          ...s,
          tasks: updateActiveTask(s.tasks, s.activeTaskId, (t) => {
            const newRow: TaskRow = {
              id: generateId(),
              indent,
              cells: Object.fromEntries(t.columns.map((c) => [c.id, null])),
              collapsed: false,
            };
            if (afterId === null) {
              return { ...t, rows: [...t.rows, newRow] };
            }
            const idx = t.rows.findIndex((r) => r.id === afterId);
            const rows = [...t.rows];
            rows.splice(idx + 1, 0, newRow);
            return { ...t, rows };
          }),
        };
        persist(next);
        return next;
      }),

    updateCell: (rowId, colId, value) =>
      set((s) => {
        const next = {
          ...s,
          tasks: updateActiveTask(s.tasks, s.activeTaskId, (t) => ({
            ...t,
            rows: t.rows.map((r) =>
              r.id === rowId ? { ...r, cells: { ...r.cells, [colId]: value } } : r
            ),
          })),
        };
        persist(next);
        return next;
      }),

    updateRowIndent: (rowId, indent) =>
      set((s) => {
        const clamped = Math.max(0, indent);
        const next = {
          ...s,
          tasks: updateActiveTask(s.tasks, s.activeTaskId, (t) => ({
            ...t,
            rows: t.rows.map((r) => (r.id === rowId ? { ...r, indent: clamped } : r)),
          })),
        };
        persist(next);
        return next;
      }),

    removeRow: (id) =>
      set((s) => {
        const next = {
          ...s,
          tasks: updateActiveTask(s.tasks, s.activeTaskId, (t) => {
            if (t.rows.length <= 1) return t; // keep at least one row
            return { ...t, rows: t.rows.filter((r) => r.id !== id) };
          }),
        };
        persist(next);
        return next;
      }),

    moveRow: (sourceId, targetId, position) =>
      set((s) => {
        const next = {
          ...s,
          tasks: updateActiveTask(s.tasks, s.activeTaskId, (t) => {
            const rows = t.rows;
            const sourceIdx = rows.findIndex((r) => r.id === sourceId);
            const targetIdx = rows.findIndex((r) => r.id === targetId);
            if (sourceIdx === -1 || targetIdx === -1 || sourceId === targetId) return t;

            // Collect source row and its children
            const sourceRow = rows[sourceIdx];
            const movedIds = new Set<string>();
            movedIds.add(sourceId);
            for (let i = sourceIdx + 1; i < rows.length; i++) {
              if (rows[i].indent <= sourceRow.indent) break;
              movedIds.add(rows[i].id);
            }
            const movedRows = rows.filter((r) => movedIds.has(r.id));
            const remainingRows = rows.filter((r) => !movedIds.has(r.id));

            // Determine new indent for the source row
            let newIndent: number;
            if (position === 'child') {
              newIndent = rows[targetIdx].indent + 1;
            } else {
              newIndent = rows[targetIdx].indent;
            }
            const indentDelta = newIndent - sourceRow.indent;

            // Adjust indents of moved rows
            const adjustedMoved = movedRows.map((r) => ({
              ...r,
              indent: Math.max(0, r.indent + indentDelta),
            }));

            // Find insertion point in remaining rows
            const newTargetIdx = remainingRows.findIndex((r) => r.id === targetId);
            let insertAt: number;
            if (position === 'before') {
              insertAt = newTargetIdx;
            } else {
              // 'after' or 'child' — insert after target and its children
              insertAt = newTargetIdx + 1;
              const targetIndent = rows[targetIdx].indent;
              for (let i = newTargetIdx + 1; i < remainingRows.length; i++) {
                if (remainingRows[i].indent > targetIndent) {
                  insertAt = i + 1;
                } else {
                  break;
                }
              }
            }

            const newRows = [...remainingRows];
            newRows.splice(insertAt, 0, ...adjustedMoved);
            return { ...t, rows: newRows };
          }),
        };
        persist(next);
        return next;
      }),

    toggleCollapse: (id) =>
      set((s) => {
        const next = {
          ...s,
          tasks: updateActiveTask(s.tasks, s.activeTaskId, (t) => ({
            ...t,
            rows: t.rows.map((r) => (r.id === id ? { ...r, collapsed: !r.collapsed } : r)),
          })),
        };
        persist(next);
        return next;
      }),

    // --- Global ---

    setViewMode: (mode) =>
      set((s) => {
        const next = { ...s, viewMode: mode };
        persist(next);
        return next;
      }),

    setLocale: (locale) =>
      set((s) => {
        const next = { ...s, locale };
        persist(next);
        return next;
      }),
  };
});

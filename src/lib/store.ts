import { create } from 'zustand';
import { nanoid } from 'nanoid';
import type { Directory, Task, ColumnDef, TaskRow, ViewMode, Locale, TaskState } from './types';

function generateId(): string {
  return nanoid(10);
}

function getDefaultState(): TaskState {
  return {
    directories: [],
    tasks: [],
    activeTaskId: null,
    sidebarOpen: true,
    viewMode: 'outline',
    locale: 'en',
  };
}

const DEFAULT_COLUMNS: ColumnDef[] = [
  { id: 'task', name: 'Task', type: 'text', width: 300 },
];

function createDefaultRows(): TaskRow[] {
  return [{ id: generateId(), indent: 0, cells: { task: null }, collapsed: false }];
}

function updateActiveTask(tasks: Task[], activeTaskId: string | null, updater: (task: Task) => Task): Task[] {
  if (!activeTaskId) return tasks;
  return tasks.map((t) => (t.id === activeTaskId ? updater(t) : t));
}

interface HistoryState {
  past: TaskState[];
  future: TaskState[];
}

interface TaskActions {
  addDirectory: (name: string) => void;
  removeDirectory: (id: string) => void;
  renameDirectory: (id: string, name: string) => void;
  toggleDirectoryCollapse: (id: string) => void;
  addTask: (directoryId: string, name: string) => void;
  removeTask: (id: string) => void;
  renameTask: (id: string, name: string) => void;
  setActiveTask: (id: string) => void;
  toggleSidebar: () => void;
  addColumn: (col: ColumnDef) => void;
  updateColumn: (id: string, partial: Partial<ColumnDef>) => void;
  removeColumn: (id: string) => void;
  addRow: (afterId: string | null, indent: number) => void;
  addRows: (afterId: string | null, rows: { indent: number; cells: Record<string, string | number | boolean | null> }[]) => void;
  updateCell: (rowId: string, colId: string, value: string | number | boolean | null) => void;
  updateRowIndent: (rowId: string, indent: number) => void;
  removeRow: (id: string) => void;
  moveRow: (sourceId: string, targetId: string, position: 'before' | 'after' | 'child') => void;
  toggleCollapse: (id: string) => void;
  duplicateRow: (rowId: string) => void;
  collapseAll: () => void;
  expandAll: () => void;
  sortByColumn: (columnId: string, direction: 'asc' | 'desc') => void;
  setViewMode: (mode: ViewMode) => void;
  setLocale: (locale: Locale) => void;
  setFilter: (query: string) => void;
  filter: string;
  removeRows: (rowIds: string[]) => void;
  indentRows: (rowIds: string[], delta: number) => void;
  exportData: () => string;
  importData: (json: string) => boolean;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  addTag: (rowId: string, tag: string) => void;
  removeTag: (rowId: string, tag: string) => void;
  isLoading: boolean;
  init: () => Promise<void>;
}

const MAX_HISTORY = 50;

export const useTaskStore = create<TaskState & TaskActions & HistoryState>()((set, get) => {
  let persistTimeout: NodeJS.Timeout | null = null;

  async function persist(state: TaskState) {
    if (persistTimeout) clearTimeout(persistTimeout);
    persistTimeout = setTimeout(async () => {
      try {
        await fetch('/api/state', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'save', state }),
        });
      } catch (error) {
        console.error('Failed to persist state:', error);
      }
    }, 100);
  }

  function pushHistory(state: TaskState) {
    set((s) => ({
      past: [...s.past.slice(-MAX_HISTORY + 1), state],
      future: [],
    }));
  }

  return {
    ...getDefaultState(),
    past: [],
    future: [],
    filter: '',
    isLoading: true,

    init: async () => {
      try {
        await fetch('/api/state', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'init' }),
        });

        const res = await fetch('/api/state');
        if (!res.ok) throw new Error('Failed to load state');
        const state = await res.json();
        set({ ...state, isLoading: false });
      } catch (error) {
        console.error('Failed to load state:', error);
        const dirId = generateId();
        const taskId = generateId();
        set({
          directories: [{ id: dirId, name: 'My Project', collapsed: false }],
          tasks: [{ id: taskId, directoryId: dirId, name: 'Getting Started', columns: [...DEFAULT_COLUMNS], rows: createDefaultRows() }],
          activeTaskId: taskId,
          sidebarOpen: true,
          viewMode: 'outline',
          locale: 'en',
          isLoading: false,
        });
      }
    },

    undo: () => {
      const { past, future } = get();
      if (past.length === 0) return;
      const prev = past[past.length - 1];
      const current = {
        directories: get().directories,
        tasks: get().tasks,
        activeTaskId: get().activeTaskId,
        sidebarOpen: get().sidebarOpen,
        viewMode: get().viewMode,
        locale: get().locale,
      };
      set({
        ...prev,
        past: past.slice(0, -1),
        future: [current, ...future],
      });
      persist(prev);
    },

    redo: () => {
      const { past, future } = get();
      if (future.length === 0) return;
      const next = future[0];
      const current = {
        directories: get().directories,
        tasks: get().tasks,
        activeTaskId: get().activeTaskId,
        sidebarOpen: get().sidebarOpen,
        viewMode: get().viewMode,
        locale: get().locale,
      };
      set({
        ...next,
        past: [...past, current],
        future: future.slice(1),
      });
      persist(next);
    },

    canUndo: () => get().past.length > 0,
    canRedo: () => get().future.length > 0,

    addDirectory: (name) => {
      const state = get();
      pushHistory(state);
      const dir: Directory = { id: generateId(), name, collapsed: false };
      const next = { ...state, directories: [...state.directories, dir] };
      persist(next);
      set(next);
    },

    removeDirectory: (id) => {
      const state = get();
      pushHistory(state);
      const next = {
        ...state,
        directories: state.directories.filter((d) => d.id !== id),
        tasks: state.tasks.filter((t) => t.directoryId !== id),
        activeTaskId: state.activeTaskId && state.tasks.some((t) => t.id === state.activeTaskId && t.directoryId === id)
          ? null
          : state.activeTaskId,
      };
      persist(next);
      set(next);
    },

    renameDirectory: (id, name) => {
      const state = get();
      pushHistory(state);
      const next = {
        ...state,
        directories: state.directories.map((d) => (d.id === id ? { ...d, name } : d)),
      };
      persist(next);
      set(next);
    },

    toggleDirectoryCollapse: (id) => {
      const state = get();
      const next = {
        ...state,
        directories: state.directories.map((d) => (d.id === id ? { ...d, collapsed: !d.collapsed } : d)),
      };
      persist(next);
      set(next);
    },

    addTask: (directoryId, name) => {
      const state = get();
      pushHistory(state);
      const id = generateId();
      const task: Task = {
        id,
        directoryId,
        name,
        columns: DEFAULT_COLUMNS.map((c) => ({ ...c })),
        rows: createDefaultRows(),
      };
      const next = {
        ...state,
        tasks: [...state.tasks, task],
        activeTaskId: id,
      };
      persist(next);
      set(next);
      return id;
    },

    removeTask: (id) => {
      const state = get();
      pushHistory(state);
      const next = {
        ...state,
        tasks: state.tasks.filter((t) => t.id !== id),
        activeTaskId: state.activeTaskId === id ? null : state.activeTaskId,
      };
      persist(next);
      set(next);
    },

    renameTask: (id, name) => {
      const state = get();
      pushHistory(state);
      const next = {
        ...state,
        tasks: state.tasks.map((t) => (t.id === id ? { ...t, name } : t)),
      };
      persist(next);
      set(next);
    },

    setActiveTask: (id) => {
      const state = get();
      const next = { ...state, activeTaskId: id };
      persist(next);
      set(next);
    },

    toggleSidebar: () => {
      const state = get();
      const next = { ...state, sidebarOpen: !state.sidebarOpen };
      persist(next);
      set(next);
    },

    addColumn: (col) => {
      const state = get();
      pushHistory(state);
      const next = {
        ...state,
        tasks: updateActiveTask(state.tasks, state.activeTaskId, (t) => ({
          ...t,
          columns: [...t.columns, col],
          rows: t.rows.map((r) => ({
            ...r,
            cells: { ...r.cells, [col.id]: null },
          })),
        })),
      };
      persist(next);
      set(next);
    },

    updateColumn: (id, partial) => {
      const state = get();
      pushHistory(state);
      const next = {
        ...state,
        tasks: updateActiveTask(state.tasks, state.activeTaskId, (t) => ({
          ...t,
          columns: t.columns.map((c) => (c.id === id ? { ...c, ...partial } : c)),
        })),
      };
      persist(next);
      set(next);
    },

    removeColumn: (id) => {
      const state = get();
      pushHistory(state);
      const next = {
        ...state,
        tasks: updateActiveTask(state.tasks, state.activeTaskId, (t) => ({
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
      set(next);
    },

    addRow: (afterId, indent) => {
      const state = get();
      pushHistory(state);
      const next = {
        ...state,
        tasks: updateActiveTask(state.tasks, state.activeTaskId, (t) => {
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
      set(next);
    },

    addRows: (afterId, newRows) => {
      const state = get();
      pushHistory(state);
      const next = {
        ...state,
        tasks: updateActiveTask(state.tasks, state.activeTaskId, (t) => {
          const rowsToInsert = newRows.map((r) => ({
            id: generateId(),
            indent: r.indent,
            cells: { ...r.cells },
            collapsed: false,
          }));
          if (afterId === null) {
            return { ...t, rows: [...t.rows, ...rowsToInsert] };
          }
          const idx = t.rows.findIndex((r) => r.id === afterId);
          const rows = [...t.rows];
          rows.splice(idx + 1, 0, ...rowsToInsert);
          return { ...t, rows };
        }),
      };
      persist(next);
      set(next);
    },

    updateCell: (rowId, colId, value) => {
      const state = get();
      pushHistory(state);
      const next = {
        ...state,
        tasks: updateActiveTask(state.tasks, state.activeTaskId, (t) => {
          const firstColId = t.columns[0]?.id;
          const isTaskColCleared = colId === firstColId && (value === null || value === '');

          return {
            ...t,
            rows: t.rows.map((r) =>
              r.id === rowId
                ? {
                    ...r,
                    cells: isTaskColCleared
                      ? Object.fromEntries(Object.keys(r.cells).map((k) => [k, null]))
                      : { ...r.cells, [colId]: value },
                  }
                : r
            ),
          };
        }),
      };
      persist(next);
      set(next);
    },

    updateRowIndent: (rowId, indent) => {
      const state = get();
      pushHistory(state);
      const clamped = Math.max(0, indent);
      const next = {
        ...state,
        tasks: updateActiveTask(state.tasks, state.activeTaskId, (t) => ({
          ...t,
          rows: t.rows.map((r) => (r.id === rowId ? { ...r, indent: clamped } : r)),
        })),
      };
      persist(next);
      set(next);
    },

    removeRow: (id) => {
      const state = get();
      pushHistory(state);
      const next = {
        ...state,
        tasks: updateActiveTask(state.tasks, state.activeTaskId, (t) => {
          if (t.rows.length <= 1) return t;
          return { ...t, rows: t.rows.filter((r) => r.id !== id) };
        }),
      };
      persist(next);
      set(next);
    },

    moveRow: (sourceId, targetId, position) => {
      const state = get();
      pushHistory(state);
      const next = {
        ...state,
        tasks: updateActiveTask(state.tasks, state.activeTaskId, (t) => {
          const rows = t.rows;
          const sourceIdx = rows.findIndex((r) => r.id === sourceId);
          const targetIdx = rows.findIndex((r) => r.id === targetId);
          if (sourceIdx === -1 || targetIdx === -1 || sourceId === targetId) return t;

          const sourceRow = rows[sourceIdx];
          const movedIds = new Set<string>();
          movedIds.add(sourceId);
          for (let i = sourceIdx + 1; i < rows.length; i++) {
            if (rows[i].indent <= sourceRow.indent) break;
            movedIds.add(rows[i].id);
          }
          const movedRows = rows.filter((r) => movedIds.has(r.id));
          const remainingRows = rows.filter((r) => !movedIds.has(r.id));

          let newIndent: number;
          if (position === 'child') {
            newIndent = rows[targetIdx].indent + 1;
          } else {
            newIndent = rows[targetIdx].indent;
          }
          const indentDelta = newIndent - sourceRow.indent;

          const adjustedMoved = movedRows.map((r) => ({
            ...r,
            indent: Math.max(0, r.indent + indentDelta),
          }));

          const newTargetIdx = remainingRows.findIndex((r) => r.id === targetId);
          let insertAt: number;
          if (position === 'before') {
            insertAt = newTargetIdx;
          } else {
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
      set(next);
    },

    toggleCollapse: (id) => {
      const state = get();
      pushHistory(state);
      const next = {
        ...state,
        tasks: updateActiveTask(state.tasks, state.activeTaskId, (t) => ({
          ...t,
          rows: t.rows.map((r) => (r.id === id ? { ...r, collapsed: !r.collapsed } : r)),
        })),
      };
      persist(next);
      set(next);
    },

    duplicateRow: (rowId) => {
      const state = get();
      if (!state.activeTaskId) return;
      pushHistory(state);
      const task = state.tasks.find((t) => t.id === state.activeTaskId);
      if (!task) return;

      const rowIdx = task.rows.findIndex((r) => r.id === rowId);
      if (rowIdx === -1) return;

      const row = task.rows[rowIdx];
      const rowsToDuplicate: TaskRow[] = [row];
      for (let i = rowIdx + 1; i < task.rows.length; i++) {
        if (task.rows[i].indent > row.indent) {
          rowsToDuplicate.push(task.rows[i]);
        } else {
          break;
        }
      }

      const duplicatedRows = rowsToDuplicate.map((r) => ({
        id: generateId(),
        indent: r.indent,
        cells: { ...r.cells },
        collapsed: false,
        tags: r.tags,
      }));

      const next = {
        ...state,
        tasks: updateActiveTask(state.tasks, state.activeTaskId, (t) => {
          const insertIdx = rowIdx + rowsToDuplicate.length;
          const rows = [...t.rows];
          rows.splice(insertIdx, 0, ...duplicatedRows);
          return { ...t, rows };
        }),
      };
      persist(next);
      set(next);
    },

    collapseAll: () => {
      const state = get();
      pushHistory(state);
      const next = {
        ...state,
        tasks: updateActiveTask(state.tasks, state.activeTaskId, (t) => ({
          ...t,
          rows: t.rows.map((r) => ({ ...r, collapsed: true })),
        })),
      };
      persist(next);
      set(next);
    },

    expandAll: () => {
      const state = get();
      pushHistory(state);
      const next = {
        ...state,
        tasks: updateActiveTask(state.tasks, state.activeTaskId, (t) => ({
          ...t,
          rows: t.rows.map((r) => ({ ...r, collapsed: false })),
        })),
      };
      persist(next);
      set(next);
    },

    sortByColumn: (columnId, direction) => {
      const state = get();
      pushHistory(state);
      const next = {
        ...state,
        tasks: updateActiveTask(state.tasks, state.activeTaskId, (t) => {
          const hierarchies: { root: TaskRow; children: TaskRow[] }[] = [];
          let currentRoot: { root: TaskRow; children: TaskRow[] } | null = null;

          for (const row of t.rows) {
            if (row.indent === 0) {
              currentRoot = { root: row, children: [] };
              hierarchies.push(currentRoot);
            } else if (currentRoot) {
              currentRoot.children.push(row);
            }
          }

          function getValue(row: TaskRow): string | number | boolean | null {
            return row.cells[columnId] ?? null;
          }

          function compareRoots(a: { root: TaskRow }, b: { root: TaskRow }): number {
            const aVal = getValue(a.root);
            const bVal = getValue(b.root);
            if (aVal === null || aVal === '') return 1;
            if (bVal === null || bVal === '') return -1;
            let cmp = 0;
            if (typeof aVal === 'string' && typeof bVal === 'string') {
              cmp = aVal.localeCompare(bVal);
            } else if (typeof aVal === 'number' && typeof bVal === 'number') {
              cmp = aVal - bVal;
            } else if (typeof aVal === 'boolean' && typeof bVal === 'boolean') {
              cmp = aVal === bVal ? 0 : aVal ? -1 : 1;
            }
            return direction === 'asc' ? cmp : -cmp;
          }

          hierarchies.sort(compareRoots);

          const sortedRows: TaskRow[] = [];
          for (const h of hierarchies) {
            sortedRows.push(h.root);
            sortedRows.push(...h.children);
          }

          return { ...t, rows: sortedRows };
        }),
      };
      persist(next);
      set(next);
    },

    setFilter: (query) => {
      set({ filter: query });
    },

    removeRows: (rowIds) => {
      const state = get();
      pushHistory(state);
      const idSet = new Set(rowIds);
      const next = {
        ...state,
        tasks: updateActiveTask(state.tasks, state.activeTaskId, (t) => {
          const remaining = t.rows.filter((r) => !idSet.has(r.id));
          if (remaining.length === 0) return t;
          return { ...t, rows: remaining };
        }),
      };
      persist(next);
      set(next);
    },

    indentRows: (rowIds, delta) => {
      const state = get();
      pushHistory(state);
      const idSet = new Set(rowIds);
      const next = {
        ...state,
        tasks: updateActiveTask(state.tasks, state.activeTaskId, (t) => ({
          ...t,
          rows: t.rows.map((r) =>
            idSet.has(r.id) ? { ...r, indent: Math.max(0, r.indent + delta) } : r
          ),
        })),
      };
      persist(next);
      set(next);
    },

    exportData: () => {
      const state = get();
      return JSON.stringify({
        version: '1.0',
        exportedAt: new Date().toISOString(),
        directories: state.directories,
        tasks: state.tasks,
      }, null, 2);
    },

    importData: (json) => {
      try {
        const data = JSON.parse(json);
        if (!data.directories || !data.tasks) return false;
        const state = get();
        pushHistory(state);
        const next = {
          ...state,
          directories: data.directories,
          tasks: data.tasks,
          activeTaskId: data.tasks[0]?.id ?? null,
        };
        persist(next);
        set(next);
        return true;
      } catch {
        return false;
      }
    },

    addTag: (rowId, tag) => {
      const state = get();
      pushHistory(state);
      const next = {
        ...state,
        tasks: updateActiveTask(state.tasks, state.activeTaskId, (t) => ({
          ...t,
          rows: t.rows.map((r) =>
            r.id === rowId ? { ...r, tags: [...(r.tags || []), tag] } : r
          ),
        })),
      };
      persist(next);
      set(next);
    },

    removeTag: (rowId, tag) => {
      const state = get();
      pushHistory(state);
      const next = {
        ...state,
        tasks: updateActiveTask(state.tasks, state.activeTaskId, (t) => ({
          ...t,
          rows: t.rows.map((r) =>
            r.id === rowId ? { ...r, tags: (r.tags || []).filter((t) => t !== tag) } : r
          ),
        })),
      };
      persist(next);
      set(next);
    },

    setViewMode: (mode) => {
      const state = get();
      const next = { ...state, viewMode: mode };
      persist(next);
      set(next);
    },

    setLocale: (locale) => {
      const state = get();
      const next = { ...state, locale };
      persist(next);
      set(next);
    },
  };
});

export { generateId };
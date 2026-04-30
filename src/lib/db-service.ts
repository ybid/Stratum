import pool from './db';
import type { Directory, Task, TaskRow, TaskState, ColumnDef } from './types';
import { generateId } from './store';

export async function loadState(): Promise<TaskState> {
  const [dirRows] = await pool.query('SELECT * FROM directories ORDER BY created_at') as [any[], any];
  const directories: Directory[] = dirRows.map((r: any) => ({
    id: r.id,
    name: r.name,
    collapsed: Boolean(r.collapsed),
  }));

  const [taskRows] = await pool.query('SELECT * FROM tasks ORDER BY created_at') as [any[], any];
  const tasks: Task[] = await Promise.all(
    taskRows.map(async (t: any) => {
      const columns: ColumnDef[] = typeof t.columns === 'string' ? JSON.parse(t.columns) : t.columns;
      const [rowResult] = await pool.query(
        'SELECT * FROM task_rows WHERE task_id = ? ORDER BY sort_order',
        [t.id]
      );
      const rows: TaskRow[] = (rowResult as any[]).map((r: any) => ({
        id: r.id,
        indent: r.indent,
        cells: typeof r.cells === 'string' ? JSON.parse(r.cells) : r.cells,
        collapsed: Boolean(r.collapsed),
        tags: r.tags ? (typeof r.tags === 'string' ? JSON.parse(r.tags) : r.tags) : [],
      }));
      return {
        id: t.id,
        directoryId: t.directory_id,
        name: t.name,
        columns,
        rows,
      };
    })
  );

  const [stateRows] = await pool.query('SELECT * FROM app_state WHERE id = 1');
  const stateRow = (stateRows as any[])[0];
  const appState = stateRow ? {
    activeTaskId: stateRow.active_task_id,
    sidebarOpen: Boolean(stateRow.sidebar_open),
    viewMode: stateRow.view_mode as 'outline' | 'flat',
    locale: stateRow.locale as 'zh' | 'en',
  } : { activeTaskId: null, sidebarOpen: true, viewMode: 'outline' as const, locale: 'en' as const };

  return {
    directories,
    tasks,
    ...appState,
  };
}

export async function saveDirectories(directories: Directory[]) {
  await pool.query('DELETE FROM directories');
  if (directories.length === 0) return;
  const values = directories.map(d => [d.id, d.name, d.collapsed ? 1 : 0]);
  await pool.query('INSERT INTO directories (id, name, collapsed) VALUES ?', [values]);
}

export async function saveTasks(tasks: Task[]) {
  await pool.query('DELETE FROM task_rows');
  await pool.query('DELETE FROM tasks');
  for (const task of tasks) {
    await pool.query(
      'INSERT INTO tasks (id, directory_id, name, columns) VALUES (?, ?, ?, ?)',
      [task.id, task.directoryId, task.name, JSON.stringify(task.columns)]
    );
    for (let i = 0; i < task.rows.length; i++) {
      const row = task.rows[i];
      await pool.query(
        'INSERT INTO task_rows (id, task_id, indent, cells, collapsed, tags, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [row.id, task.id, row.indent, JSON.stringify(row.cells), row.collapsed ? 1 : 0, JSON.stringify(row.tags || []), i]
      );
    }
  }
}

export async function saveAppState(state: { activeTaskId: string | null; sidebarOpen: boolean; viewMode: 'outline' | 'flat' | 'kanban' | 'calendar' | 'gantt'; locale: 'zh' | 'en' }) {
  await pool.query(
    'UPDATE app_state SET active_task_id = ?, sidebar_open = ?, view_mode = ?, locale = ? WHERE id = 1',
    [state.activeTaskId, state.sidebarOpen ? 1 : 0, state.viewMode, state.locale]
  );
}

export async function saveState(state: TaskState) {
  await saveDirectories(state.directories);
  await saveTasks(state.tasks);
  await saveAppState({
    activeTaskId: state.activeTaskId,
    sidebarOpen: state.sidebarOpen,
    viewMode: state.viewMode,
    locale: state.locale,
  });
}

export async function createDefaultData() {
  const [rows] = await pool.query('SELECT COUNT(*) as cnt FROM directories');
  if ((rows as any[])[0].cnt > 0) return;

  const dirId = generateId();
  const taskId = generateId();
  const rowId = generateId();

  await pool.query(
    'INSERT INTO directories (id, name, collapsed) VALUES (?, ?, ?)',
    [dirId, 'My Project', 0]
  );
  await pool.query(
    'INSERT INTO tasks (id, directory_id, name, columns) VALUES (?, ?, ?, ?)',
    [taskId, dirId, 'Getting Started', JSON.stringify([{ id: 'task', name: 'Task', type: 'text', width: 300 }])]
  );
  await pool.query(
    'INSERT INTO task_rows (id, task_id, indent, cells, collapsed, tags, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [rowId, taskId, 0, JSON.stringify({ task: null }), 0, '[]', 0]
  );
  await pool.query('UPDATE app_state SET active_task_id = ? WHERE id = 1', [taskId]);
}
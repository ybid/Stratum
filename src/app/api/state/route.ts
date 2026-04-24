import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { TaskState, Directory, Task, ColumnDef, TaskRow } from '@/lib/types';
import { nanoid } from 'nanoid';

function generateId(): string {
  return nanoid(10);
}

const DEFAULT_COLUMNS: ColumnDef[] = [
  { id: 'task', name: 'Task', type: 'text', width: 300 },
];

function createDefaultRows(): TaskRow[] {
  return [{ id: generateId(), indent: 0, cells: { task: null }, collapsed: false }];
}

export async function GET() {
  try {
    const [dirRows] = await pool.query('SELECT * FROM directories ORDER BY created_at');
    const directories: Directory[] = (dirRows as any[]).map((r) => ({
      id: r.id,
      name: r.name,
      collapsed: Boolean(r.collapsed),
    }));

    const [taskRows] = await pool.query('SELECT * FROM tasks ORDER BY created_at');
    const tasks: Task[] = await Promise.all(
      (taskRows as any[]).map(async (t) => {
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

    return NextResponse.json({
      directories,
      tasks,
      ...appState,
    });
  } catch (error) {
    console.error('Failed to load state:', error);
    return NextResponse.json({ error: 'Failed to load state' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, state } = body;

    if (action === 'save') {
      const { directories, tasks, activeTaskId, sidebarOpen, viewMode, locale } = state as TaskState;
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();

        await connection.query('DELETE FROM task_rows');
        await connection.query('DELETE FROM tasks');
        await connection.query('DELETE FROM directories');

        for (const d of directories) {
          await connection.query(
            'INSERT INTO directories (id, name, collapsed) VALUES (?, ?, ?)',
            [d.id, d.name, d.collapsed ? 1 : 0]
          );
        }

        for (const task of tasks) {
          await connection.query(
            'INSERT INTO tasks (id, directory_id, name, columns) VALUES (?, ?, ?, ?)',
            [task.id, task.directoryId, task.name, JSON.stringify(task.columns)]
          );
          for (let i = 0; i < task.rows.length; i++) {
            const row = task.rows[i];
            await connection.query(
              'INSERT INTO task_rows (id, task_id, indent, cells, collapsed, tags, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)',
              [row.id, task.id, row.indent, JSON.stringify(row.cells), row.collapsed ? 1 : 0, JSON.stringify(row.tags || []), i]
            );
          }
        }

        await connection.query(
          'UPDATE app_state SET active_task_id = ?, sidebar_open = ?, view_mode = ?, locale = ? WHERE id = 1',
          [activeTaskId, sidebarOpen ? 1 : 0, viewMode, locale]
        );

        await connection.commit();
        return NextResponse.json({ success: true });
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    }

    if (action === 'init') {
      const [rows] = await pool.query('SELECT COUNT(*) as cnt FROM directories');
      if ((rows as any[])[0].cnt > 0) {
        return NextResponse.json({ created: false });
      }

      const dirId = generateId();
      const taskId = generateId();
      const rowId = generateId();

      await pool.query('INSERT INTO directories (id, name, collapsed) VALUES (?, ?, ?)', [dirId, 'My Project', 0]);
      await pool.query(
        'INSERT INTO tasks (id, directory_id, name, columns) VALUES (?, ?, ?, ?)',
        [taskId, dirId, 'Getting Started', JSON.stringify(DEFAULT_COLUMNS)]
      );
      await pool.query(
        'INSERT INTO task_rows (id, task_id, indent, cells, collapsed, tags, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [rowId, taskId, 0, JSON.stringify({ task: null }), 0, '[]', 0]
      );
      await pool.query('UPDATE app_state SET active_task_id = ? WHERE id = 1', [taskId]);

      return NextResponse.json({ created: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Operation failed' }, { status: 500 });
  }
}
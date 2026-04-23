'use client';

import { useState, useCallback, useMemo } from 'react';
import { useTaskStore } from '@/lib/store';
import { t } from '@/lib/i18n';
import type { TaskRow as TaskRowType } from '@/lib/types';
import { ColumnHeader } from './ColumnHeader';
import { TaskRow as TaskRowComponent } from './TaskRow';

export const GUTTER_WIDTH = 28;
export const INDENT_UNIT = 24;

export function TaskBoard() {
  const activeTaskId = useTaskStore((s) => s.activeTaskId);
  const tasks = useTaskStore((s) => s.tasks);
  const viewMode = useTaskStore((s) => s.viewMode);
  const locale = useTaskStore((s) => s.locale);
  const filter = useTaskStore((s) => s.filter);
  const addRow = useTaskStore((s) => s.addRow);
  const moveRow = useTaskStore((s) => s.moveRow);
  const duplicateRow = useTaskStore((s) => s.duplicateRow);
  const removeRows = useTaskStore((s) => s.removeRows);
  const sortByColumn = useTaskStore((s) => s.sortByColumn);

  const activeTask = tasks.find((t) => t.id === activeTaskId) ?? null;

  const [dragSourceId, setDragSourceId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{ id: string; position: 'before' | 'after' | 'child' } | null>(null);
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());
  const [lastClickedId, setLastClickedId] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{ columnId: string; direction: 'asc' | 'desc' } | null>(null);

  const handleDragStart = useCallback((rowId: string) => {
    setDragSourceId(rowId);
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent, rowId: string) => {
      e.preventDefault();
      if (!dragSourceId || dragSourceId === rowId) return;

      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const y = e.clientY - rect.top;
      const h = rect.height;
      const targetTask = tasks.find((t) => t.id === activeTaskId);
      if (!targetTask) return;

      const targetRow = targetTask.rows.find((r) => r.id === rowId);
      if (!targetRow) return;

      let position: 'before' | 'after' | 'child';
      if (y < h * 0.25) {
        position = 'before';
      } else if (y > h * 0.75) {
        position = 'after';
      } else {
        position = 'child';
      }

      setDropTarget({ id: rowId, position });
    },
    [dragSourceId, tasks, activeTaskId]
  );

  const handleDragLeave = useCallback(() => {
    setDropTarget(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, targetId: string) => {
      e.preventDefault();
      if (dragSourceId && dropTarget) {
        moveRow(dragSourceId, targetId, dropTarget.position);
      }
      setDragSourceId(null);
      setDropTarget(null);
    },
    [dragSourceId, dropTarget, moveRow]
  );

  const handleDragEnd = useCallback(() => {
    setDragSourceId(null);
    setDropTarget(null);
  }, []);

  const handleRowClick = useCallback(
    (rowId: string, e: React.MouseEvent) => {
      if (!activeTask) return;
      const rows = activeTask.rows;

      if (e.shiftKey && lastClickedId) {
        const lastIdx = rows.findIndex((r) => r.id === lastClickedId);
        const curIdx = rows.findIndex((r) => r.id === rowId);
        if (lastIdx === -1 || curIdx === -1) return;
        const start = Math.min(lastIdx, curIdx);
        const end = Math.max(lastIdx, curIdx);
        const newSelected = new Set<string>();
        for (let i = start; i <= end; i++) {
          newSelected.add(rows[i].id);
        }
        setSelectedRowIds(newSelected);
      } else if (e.ctrlKey || e.metaKey) {
        setSelectedRowIds((prev) => {
          const next = new Set(prev);
          if (next.has(rowId)) next.delete(rowId);
          else next.add(rowId);
          return next;
        });
      } else {
        setSelectedRowIds(new Set([rowId]));
      }
      setLastClickedId(rowId);
    },
    [activeTask, lastClickedId]
  );

  const handleBatchIndent = useCallback(
    (delta: number) => {
      const indentRows = useTaskStore.getState().indentRows;
      indentRows(Array.from(selectedRowIds), delta);
    },
    [selectedRowIds]
  );

  const handleBatchDelete = useCallback(() => {
    removeRows(Array.from(selectedRowIds));
    setSelectedRowIds(new Set());
  }, [selectedRowIds, removeRows]);

  const handleBatchDuplicate = useCallback(() => {
    const firstId = Array.from(selectedRowIds)[0];
    if (firstId) {
      duplicateRow(firstId);
    }
  }, [selectedRowIds, duplicateRow]);

  const handleSort = useCallback((columnId: string) => {
    setSortConfig((prev) => {
      if (prev?.columnId === columnId) {
        if (prev.direction === 'asc') {
          sortByColumn(columnId, 'desc');
          return { columnId, direction: 'desc' };
        } else {
          setSortConfig(null);
          return null;
        }
      } else {
        sortByColumn(columnId, 'asc');
        return { columnId, direction: 'asc' };
      }
    });
  }, [sortByColumn]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (selectedRowIds.size <= 1) return;
      if (e.key === 'Tab') {
        e.preventDefault();
        handleBatchIndent(e.shiftKey ? -1 : 1);
      }
    },
    [selectedRowIds.size, handleBatchIndent]
  );

  if (!activeTask) {
    return (
      <div className="flex items-center justify-center h-full text-zinc-400">
        <div className="text-center">
          <p className="text-lg">{t(locale, 'noTaskSelected')}</p>
          <p className="text-sm mt-1">{t(locale, 'noTaskSelectedDesc')}</p>
        </div>
      </div>
    );
  }

  const { columns, rows } = activeTask;

  // Filter rows based on filter query
  const filteredRows = useMemo(() => {
    if (!filter.trim()) return rows;
    const query = filter.toLowerCase();
    return rows.filter((row) => {
      return Object.values(row.cells).some((val) => {
        if (val === null || val === undefined) return false;
        return String(val).toLowerCase().includes(query);
      });
    });
  }, [rows, filter]);

  const visibleRows = viewMode === 'outline' ? getVisibleRows(filteredRows) : filteredRows;

  return (
    <div className="w-full" onKeyDown={handleKeyDown} tabIndex={-1}>
      {/* Column headers */}
      <div className="flex items-center border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 sticky top-0 z-10">
        <div className="shrink-0" style={{ width: GUTTER_WIDTH }} />
        <ColumnHeader columns={columns} onSort={handleSort} sortConfig={sortConfig} />
      </div>

      {/* Rows */}
      <div>
        {visibleRows.map((row) => (
          <TaskRowComponent
            key={row.id}
            row={row}
            allRows={filteredRows}
            columns={columns}
            viewMode={viewMode}
            isDragging={dragSourceId === row.id}
            dropTarget={dropTarget?.id === row.id ? dropTarget.position : null}
            isSelected={selectedRowIds.has(row.id)}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
            onClick={handleRowClick}
          />
        ))}
      </div>

      {/* Selection info bar */}
      {selectedRowIds.size > 1 && (
        <div className="flex items-center gap-3 px-3 py-1 text-xs bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border-b border-blue-200 dark:border-blue-800">
          <span>{selectedRowIds.size} rows selected</span>
          <button
            onClick={() => handleBatchIndent(-1)}
            className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800"
          >
            ← Outdent
          </button>
          <button
            onClick={() => handleBatchIndent(1)}
            className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800"
          >
            Indent →
          </button>
          <button
            onClick={handleBatchDuplicate}
            className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800"
          >
            Duplicate
          </button>
          <button
            onClick={handleBatchDelete}
            className="px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900 hover:bg-red-200 dark:hover:bg-red-800 text-red-600"
          >
            Delete
          </button>
          <button
            onClick={() => setSelectedRowIds(new Set())}
            className="ml-auto text-blue-400 hover:text-blue-600"
          >
            ✕ Clear
          </button>
        </div>
      )}

      {/* Add row button */}
      <button
        onClick={() => addRow(null, 0)}
        className="w-full text-left px-4 py-1 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
      >
        + Row
      </button>
    </div>
  );
}

function getVisibleRows(rows: TaskRowType[]): TaskRowType[] {
  const visible: TaskRowType[] = [];
  const hiddenIndents: number[] = [];

  for (const row of rows) {
    while (hiddenIndents.length > 0 && row.indent <= hiddenIndents[hiddenIndents.length - 1]) {
      hiddenIndents.pop();
    }

    if (hiddenIndents.length === 0) {
      visible.push(row);
    }

    if (row.collapsed) {
      hiddenIndents.push(row.indent);
    }
  }

  return visible;
}

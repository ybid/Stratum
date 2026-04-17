'use client';

import { useState, useCallback } from 'react';
import { useTaskStore } from '@/lib/store';
import { t } from '@/lib/i18n';
import type { TaskRow as TaskRowType } from '@/lib/types';
import { ColumnHeader } from './ColumnHeader';
import { TaskRow as TaskRowComponent } from './TaskRow';

// Fixed gutter: only drag handle, no indent
export const GUTTER_WIDTH = 28;
export const INDENT_UNIT = 24;

export function TaskBoard() {
  const activeTaskId = useTaskStore((s) => s.activeTaskId);
  const tasks = useTaskStore((s) => s.tasks);
  const viewMode = useTaskStore((s) => s.viewMode);
  const locale = useTaskStore((s) => s.locale);
  const addRow = useTaskStore((s) => s.addRow);
  const moveRow = useTaskStore((s) => s.moveRow);

  const activeTask = tasks.find((t) => t.id === activeTaskId) ?? null;

  // Drag state
  const [dragSourceId, setDragSourceId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{ id: string; position: 'before' | 'after' | 'child' } | null>(null);

  // Multi-select state
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());
  const [lastClickedId, setLastClickedId] = useState<string | null>(null);

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
      const activeTask = tasks.find((t) => t.id === activeTaskId);
      if (!activeTask) return;

      const targetRow = activeTask.rows.find((r) => r.id === rowId);
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

  // Row click for selection (Shift+click range, Ctrl+click toggle, click single)
  const handleRowClick = useCallback(
    (rowId: string, e: React.MouseEvent) => {
      if (!activeTask) return;
      const rows = activeTask.rows;

      if (e.shiftKey && lastClickedId) {
        // Range select: select all same-indent rows between lastClicked and this one
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
        // Toggle single
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

  // Batch indent
  const handleBatchIndent = useCallback(
    (delta: number) => {
      const updateRowIndent = useTaskStore.getState().updateRowIndent;
      selectedRowIds.forEach((id) => {
        const row = activeTask?.rows.find((r) => r.id === id);
        if (row) {
          updateRowIndent(id, row.indent + delta);
        }
      });
    },
    [selectedRowIds, activeTask]
  );

  // Keyboard shortcut for batch indent
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
  const visibleRows = viewMode === 'outline' ? getVisibleRows(rows) : rows;

  return (
    <div className="w-full" onKeyDown={handleKeyDown} tabIndex={-1}>
      {/* Column headers */}
      <div className="flex items-center border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 sticky top-0 z-10">
        <div className="shrink-0" style={{ width: GUTTER_WIDTH }} />
        <ColumnHeader columns={columns} />
      </div>

      {/* Rows */}
      <div>
        {visibleRows.map((row) => (
          <TaskRowComponent
            key={row.id}
            row={row}
            allRows={rows}
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

'use client';

import { useCallback } from 'react';
import { useTaskStore } from '@/lib/store';
import type { ColumnDef, TaskRow as TaskRowType, ViewMode } from '@/lib/types';
import { GUTTER_WIDTH, INDENT_UNIT } from './TaskBoard';
import { CellRenderer } from './CellRenderer';

interface Props {
  row: TaskRowType;
  allRows: TaskRowType[];
  columns: ColumnDef[];
  viewMode: ViewMode;
  isDragging?: boolean;
  dropTarget?: 'before' | 'after' | 'child' | null;
  isSelected?: boolean;
  onDragStart?: (rowId: string) => void;
  onDragOver?: (e: React.DragEvent, rowId: string) => void;
  onDragLeave?: () => void;
  onDrop?: (e: React.DragEvent, rowId: string) => void;
  onDragEnd?: () => void;
  onClick?: (rowId: string, e: React.MouseEvent) => void;
}

export function TaskRow({
  row,
  allRows,
  columns,
  viewMode,
  isDragging,
  dropTarget,
  isSelected,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  onClick,
}: Props) {
  const updateCell = useTaskStore((s) => s.updateCell);
  const updateRowIndent = useTaskStore((s) => s.updateRowIndent);
  const addRow = useTaskStore((s) => s.addRow);
  const removeRow = useTaskStore((s) => s.removeRow);
  const toggleCollapse = useTaskStore((s) => s.toggleCollapse);

  const hasChildren = allRows.some(
    (r) => r.indent === row.indent + 1 && isDirectChild(allRows, row, r)
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, colId: string) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        addRow(row.id, row.indent);
      } else if (e.key === 'Tab') {
        e.preventDefault();
        const delta = e.shiftKey ? -1 : 1;
        updateRowIndent(row.id, row.indent + delta);
      } else if (e.key === 'Backspace') {
        const cellValue = row.cells[colId];
        if (cellValue === null || cellValue === '') {
          e.preventDefault();
          if (row.indent > 0) {
            updateRowIndent(row.id, row.indent - 1);
          } else {
            removeRow(row.id);
          }
        }
      }
    },
    [row.id, row.indent, row.cells, addRow, updateRowIndent, removeRow]
  );

  const firstColId = columns[0]?.id;

  return (
    <div
      className={`relative flex items-center border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 ${
        isSelected ? 'bg-blue-50 dark:bg-blue-950/50' : ''
      } ${isDragging ? 'opacity-40' : ''} ${dropTarget === 'child' ? 'bg-blue-50 dark:bg-blue-950' : ''}`}
      data-row-id={row.id}
      draggable
      onDragStart={() => onDragStart?.(row.id)}
      onDragOver={(e) => onDragOver?.(e, row.id)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop?.(e, row.id)}
      onDragEnd={onDragEnd}
      onClick={(e) => onClick?.(row.id, e)}
    >
      {/* Drop indicator lines */}
      {dropTarget === 'before' && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-500 z-10" />
      )}
      {dropTarget === 'after' && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 z-10" />
      )}

      {/* Fixed gutter: only drag handle */}
      <div
        className="shrink-0 flex items-center justify-center"
        style={{ width: GUTTER_WIDTH }}
      >
        <span
          className="cursor-grab text-zinc-300 dark:text-zinc-600 hover:text-zinc-500 dark:hover:text-zinc-400 select-none text-xs active:cursor-grabbing"
          title="Drag to reorder"
        >
          ⠿
        </span>
      </div>

      {/* Cells: first column gets indent padding, others are normal */}
      {columns.map((col, colIndex) => {
        const isFirst = colIndex === 0;
        const indentPadding = isFirst ? row.indent * INDENT_UNIT : 0;

        return (
          <div
            key={col.id}
            className="relative border-r border-zinc-100 dark:border-zinc-800/50 last:border-r-0"
            style={{ width: col.width || 150 }}
          >
            {/* Indent area + collapse toggle for first column */}
            {isFirst && (
              <div
                className="absolute inset-y-0 flex items-center"
                style={{ left: 0, width: indentPadding }}
              >
                {/* Collapse toggle at the end of indent area */}
                {viewMode === 'outline' && hasChildren && (
                  <button
                    onClick={() => toggleCollapse(row.id)}
                    className="w-4 h-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 text-xs flex items-center justify-center shrink-0"
                    style={{ marginLeft: indentPadding > 0 ? indentPadding - 16 : 0 }}
                  >
                    {row.collapsed ? '▸' : '▾'}
                  </button>
                )}
              </div>
            )}
            <div style={{ paddingLeft: isFirst ? indentPadding + 4 : 0 }}>
              <CellRenderer
                column={col}
                value={row.cells[col.id] ?? null}
                onChange={(val) => updateCell(row.id, col.id, val)}
                onKeyDown={(e) => handleKeyDown(e, col.id)}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function isDirectChild(
  rows: TaskRowType[],
  parent: TaskRowType,
  candidate: TaskRowType
): boolean {
  if (candidate.indent !== parent.indent + 1) return false;
  const parentIdx = rows.findIndex((r) => r.id === parent.id);
  const candidateIdx = rows.findIndex((r) => r.id === candidate.id);
  if (candidateIdx <= parentIdx) return false;
  for (let i = parentIdx + 1; i < candidateIdx; i++) {
    if (rows[i].indent <= parent.indent) return false;
  }
  return true;
}

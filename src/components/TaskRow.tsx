'use client';

import { useCallback, useState } from 'react';
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
  const addRows = useTaskStore((s) => s.addRows);
  const removeRow = useTaskStore((s) => s.removeRow);
  const toggleCollapse = useTaskStore((s) => s.toggleCollapse);
  const duplicateRow = useTaskStore((s) => s.duplicateRow);
  const removeTag = useTaskStore((s) => s.removeTag);
  const addTag = useTaskStore((s) => s.addTag);
  const locale = useTaskStore((s) => s.locale);

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [newTag, setNewTag] = useState('');

  const firstColId = columns[0]?.id;

  function handleMultiPaste(text: string) {
    const lines = text.split('\n').filter(l => l.trim());
    if (lines.length === 0) return;
    if (lines.length === 1) {
      updateCell(row.id, firstColId, lines[0]);
    } else {
      const rowsToAdd = lines.slice(1).map(line => ({
        indent: row.indent,
        cells: { ...Object.fromEntries(columns.map(c => [c.id, null])) },
      }));
      rowsToAdd.forEach((r, i) => { (r.cells as Record<string, string | number | boolean | null>)[firstColId] = lines[i + 1]; });
      addRows(row.id, rowsToAdd);
      updateCell(row.id, firstColId, lines[0]);
    }
  }

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

  const taskValue = firstColId ? row.cells[firstColId] : null;
  const isTaskEmpty = taskValue === null || taskValue === '';

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
      onContextMenu={(e) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY });
      }}
    >
      {dropTarget === 'before' && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-500 z-10" />
      )}
      {dropTarget === 'after' && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 z-10" />
      )}

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

      {columns.map((col, colIndex) => {
        const isFirst = colIndex === 0;
        const indentPadding = isFirst ? row.indent * INDENT_UNIT : 0;
        const shouldHide = isTaskEmpty && !isFirst;

        return (
          <div
            key={col.id}
            className="relative border-r border-zinc-100 dark:border-zinc-800/50 last:border-r-0 shrink-0"
            style={{ width: col.width || 150 }}
          >
            {isFirst && (
              <div
                className="absolute inset-y-0 flex items-center"
                style={{ left: 0, width: indentPadding }}
              >
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
            {!shouldHide && (
              <div style={{ paddingLeft: isFirst ? indentPadding + 4 : 0 }}>
                <CellRenderer
                  column={col}
                  value={row.cells[col.id] ?? null}
                  onChange={(val) => {
                    console.log('[TaskRow] onChange callback:', val, 'colId:', col.id, 'rowId:', row.id);
                    updateCell(row.id, col.id, val);
                  }}
                  onKeyDown={(e) => handleKeyDown(e, col.id)}
                  onPaste={isFirst ? handleMultiPaste : undefined}
                />
              </div>
            )}
          </div>
        );
      })}

      {row.tags && row.tags.length > 0 && (
        <div className="flex items-center gap-1 px-2">
          {row.tags.map((tag) => (
            <span
              key={tag}
              className="px-1.5 py-0.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded"
            >
              {tag}
              <button
                onClick={() => removeTag(row.id, tag)}
                className="ml-1 text-blue-400 hover:text-blue-600"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {contextMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setContextMenu(null)} />
          <div
            className="fixed z-50 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded shadow-lg py-1 text-sm min-w-[140px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button
              className="w-full text-left px-3 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-700"
              onClick={() => {
                duplicateRow(row.id);
                setContextMenu(null);
              }}
            >
              {locale === 'zh' ? '复制' : 'Duplicate'}
            </button>
            <div className="px-3 py-1">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder={locale === 'zh' ? '添加标签...' : 'Add tag...'}
                className="w-full text-xs px-1 py-0.5 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-700"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newTag.trim()) {
                    addTag(row.id, newTag.trim());
                    setNewTag('');
                    setContextMenu(null);
                  }
                }}
              />
            </div>
          </div>
        </>
      )}
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
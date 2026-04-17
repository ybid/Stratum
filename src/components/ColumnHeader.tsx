'use client';

import { useState, useCallback, useRef } from 'react';
import { useTaskStore } from '@/lib/store';
import { t } from '@/lib/i18n';
import type { ColumnDef } from '@/lib/types';
import { ColumnConfigModal } from './ColumnConfigModal';

type ModalTarget = { type: 'add' } | { type: 'edit'; columnId: string } | null;

export function ColumnHeader({ columns }: { columns: ColumnDef[] }) {
  const locale = useTaskStore((s) => s.locale);
  const updateColumn = useTaskStore((s) => s.updateColumn);
  const [modalTarget, setModalTarget] = useState<ModalTarget>(null);

  // Resolve the column from the current columns prop (always fresh)
  const editingColumn = modalTarget?.type === 'edit'
    ? columns.find((c) => c.id === modalTarget.columnId) ?? null
    : null;

  // --- Column resize ---
  const resizing = useRef<{ colId: string; startX: number; startWidth: number } | null>(null);

  const handleResizeStart = useCallback(
    (e: React.MouseEvent, col: ColumnDef) => {
      e.preventDefault();
      e.stopPropagation();
      resizing.current = { colId: col.id, startX: e.clientX, startWidth: col.width || 150 };

      const handleMove = (ev: MouseEvent) => {
        if (!resizing.current) return;
        const delta = ev.clientX - resizing.current.startX;
        const newWidth = Math.max(60, resizing.current.startWidth + delta);
        updateColumn(resizing.current.colId, { width: newWidth });
      };

      const handleUp = () => {
        resizing.current = null;
        document.removeEventListener('mousemove', handleMove);
        document.removeEventListener('mouseup', handleUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };

      document.addEventListener('mousemove', handleMove);
      document.addEventListener('mouseup', handleUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    },
    [updateColumn]
  );

  return (
    <>
      <div className="flex flex-1">
        {columns.map((col) => (
          <div
            key={col.id}
            className="relative flex items-center px-2 py-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors select-none"
            style={{ width: col.width || 150 }}
            onDoubleClick={() => setModalTarget({ type: 'edit', columnId: col.id })}
            onContextMenu={(e) => {
              e.preventDefault();
              setModalTarget({ type: 'edit', columnId: col.id });
            }}
          >
            <span className="truncate">{col.name}</span>
            {/* Resize handle — separate from the clickable area */}
            <div
              className="absolute top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-zinc-400 dark:hover:bg-zinc-500 active:bg-blue-400 transition-colors z-10"
              style={{ right: -2 }}
              onMouseDown={(e) => handleResizeStart(e, col)}
            />
          </div>
        ))}
      </div>
      <button
        onClick={() => setModalTarget({ type: 'add' })}
        className="px-2 py-1 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 shrink-0"
        title={t(locale, 'addColumn')}
      >
        +
      </button>

      {modalTarget && (
        <ColumnConfigModal
          column={modalTarget.type === 'edit' ? editingColumn : null}
          onClose={() => setModalTarget(null)}
        />
      )}
    </>
  );
}

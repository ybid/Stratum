'use client';

import { useState, useRef, useEffect } from 'react';
import type { ColumnDef, EnumOption } from '@/lib/types';

interface Props {
  column: ColumnDef;
  value: string | number | boolean | null;
  onChange: (value: string | number | boolean | null) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onPaste?: (text: string) => void;
}

export function CellRenderer({ column, value, onChange, onKeyDown, onPaste }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  function handlePaste(e: React.ClipboardEvent) {
    if (!onPaste) return;
    const text = e.clipboardData.getData('text');
    if (text.includes('\n')) {
      e.preventDefault();
      onPaste(text);
    }
  }

  function getSelectedOption(): EnumOption | undefined {
    return column.options?.find(o => o.label === value);
  }

  switch (column.type) {
    case 'text':
      return (
        <input
          type="text"
          className="w-full px-2 py-1 text-sm bg-transparent outline-none"
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value || null)}
          onKeyDown={onKeyDown}
          onPaste={handlePaste}
        />
      );

    case 'number':
      return (
        <input
          type="number"
          className="w-full px-2 py-1 text-sm bg-transparent outline-none"
          value={(value as number) ?? ''}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
          onKeyDown={onKeyDown}
        />
      );

    case 'datetime':
      return (
        <input
          type="datetime-local"
          className="w-full px-2 py-1 text-sm bg-transparent outline-none"
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value || null)}
          onKeyDown={onKeyDown}
        />
      );

    case 'checkbox':
      return (
        <input
          type="checkbox"
          className="ml-2 accent-zinc-900 dark:accent-zinc-100"
          checked={!!value}
          onChange={(e) => onChange(e.target.checked)}
        />
      );

    case 'enum': {
      const selected = getSelectedOption();
      return (
        <div ref={ref} className="relative w-full">
          <button
            type="button"
            className="w-full px-2 py-1 text-sm text-left flex items-center gap-2 outline-none"
            onClick={() => setOpen(!open)}
          >
            {selected?.color && (
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: selected.color }}
              />
            )}
            <span className={selected ? '' : 'text-zinc-400'}>
              {selected?.label || '—'}
            </span>
          </button>
          {open && (
            <div className="absolute z-50 top-full left-0 mt-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded shadow-lg min-w-[120px] max-h-[200px] overflow-y-auto">
              <button
                className="w-full px-2 py-1 text-sm text-left text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                onClick={() => { onChange(null); setOpen(false); }}
              >
                —
              </button>
              {column.options?.map((opt) => (
                <button
                  key={opt.label}
                  className="w-full px-2 py-1 text-sm text-left flex items-center gap-2 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                  onClick={() => { onChange(opt.label); setOpen(false); }}
                >
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: opt.color || '#64748b' }}
                  />
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      );
    }

    default:
      return null;
  }
}
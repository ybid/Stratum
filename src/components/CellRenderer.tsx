'use client';

import type { ColumnDef } from '@/lib/types';

interface Props {
  column: ColumnDef;
  value: string | number | boolean | null;
  onChange: (value: string | number | boolean | null) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

export function CellRenderer({ column, value, onChange, onKeyDown }: Props) {
  switch (column.type) {
    case 'text':
      return (
        <input
          type="text"
          className="w-full px-2 py-1 text-sm bg-transparent outline-none"
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value || null)}
          onKeyDown={onKeyDown}
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

    case 'enum':
      return (
        <select
          className="w-full px-2 py-1 text-sm bg-transparent outline-none"
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value || null)}
          onKeyDown={onKeyDown}
        >
          <option value="">—</option>
          {column.options?.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );

    default:
      return null;
  }
}

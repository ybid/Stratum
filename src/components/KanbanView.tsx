'use client';

import { useTaskStore } from '@/lib/store';
import { t } from '@/lib/i18n';
import type { TaskRow as TaskRowType, ColumnDef, EnumOption } from '@/lib/types';

interface KanbanColumnProps {
  title: string;
  color?: string;
  rows: TaskRowType[];
  columns: ColumnDef[];
}

export function KanbanView() {
  const activeTaskId = useTaskStore((s) => s.activeTaskId);
  const tasks = useTaskStore((s) => s.tasks);
  const locale = useTaskStore((s) => s.locale);
  const updateCell = useTaskStore((s) => s.updateCell);
  const addRow = useTaskStore((s) => s.addRow);

  const activeTask = tasks.find((t) => t.id === activeTaskId);
  if (!activeTask) return null;

  const { columns, rows } = activeTask;

  // Find the first enum column
  const enumColumn = columns.find((c) => c.type === 'enum');
  if (!enumColumn || !enumColumn.options || enumColumn.options.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-zinc-400">
        <div className="text-center">
          <p className="text-lg">{locale === 'zh' ? '没有枚举列' : 'No enum column'}</p>
          <p className="text-sm mt-1">
            {locale === 'zh' ? '请添加一个枚举列来使用看板视图' : 'Add an enum column to use Kanban view'}
          </p>
        </div>
      </div>
    );
  }

  // Group rows by enum value
  const groupedRows: Record<string, TaskRowType[]> = {};
  for (const option of enumColumn.options) {
    groupedRows[option.label] = [];
  }
  // Add "unset" group for rows without a value
  groupedRows['__unset__'] = [];

  for (const row of rows) {
    const value = row.cells[enumColumn.id];
    if (value && typeof value === 'string') {
      if (groupedRows[value]) {
        groupedRows[value].push(row);
      } else {
        groupedRows['__unset__'].push(row);
      }
    } else {
      groupedRows['__unset__'].push(row);
    }
  }

  return (
    <div className="flex-1 overflow-auto p-4">
      <div className="flex gap-4 h-full">
        {enumColumn.options.map((option) => (
          <KanbanColumn
            key={option.label}
            title={option.label}
            color={option.color}
            rows={groupedRows[option.label] || []}
            columns={columns}
          />
        ))}
      </div>
    </div>
  );
}

function KanbanColumn({ title, color, rows, columns }: KanbanColumnProps) {
  const locale = useTaskStore((s) => s.locale);
  const activeTaskId = useTaskStore((s) => s.activeTaskId);
  const updateCell = useTaskStore((s) => s.updateCell);
  const addRow = useTaskStore((s) => s.addRow);
  const enumColumn = columns.find((c) => c.type === 'enum');

  return (
    <div className="w-72 shrink-0 flex flex-col bg-zinc-100 dark:bg-zinc-800/50 rounded-lg">
      {/* Column header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-200 dark:border-zinc-700">
        {color && (
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
        )}
        <span className="text-sm font-medium">{title}</span>
        <span className="text-xs text-zinc-400 ml-auto">{rows.length}</span>
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {rows.map((row) => (
          <KanbanCard
            key={row.id}
            row={row}
            columns={columns}
          />
        ))}
      </div>

      {/* Add card button */}
      <button
        onClick={() => {
          if (enumColumn && activeTaskId) {
            const newRowId = addRowToEnumColumn(activeTaskId, enumColumn.id, title, addRow);
          }
        }}
        className="m-2 p-2 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded transition-colors"
      >
        + {locale === 'zh' ? '添加卡片' : 'Add card'}
      </button>
    </div>
  );
}

function KanbanCard({ row, columns }: { row: TaskRowType; columns: ColumnDef[] }) {
  const locale = useTaskStore((s) => s.locale);
  const updateCell = useTaskStore((s) => s.updateCell);
  const firstTextColumn = columns.find((c) => c.type === 'text');

  const title = firstTextColumn
    ? (row.cells[firstTextColumn.id] as string) || ''
    : '';

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-700 p-3 hover:shadow-md transition-shadow cursor-grab">
      {/* Title */}
      <div className="text-sm font-medium mb-2 line-clamp-2">
        {title || <span className="text-zinc-400 italic">{locale === 'zh' ? '无标题' : 'Untitled'}</span>}
      </div>

      {/* Tags */}
      {row.tags && row.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {row.tags.map((tag) => (
            <span key={tag} className="px-1.5 py-0.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Other columns as mini info */}
      <div className="flex flex-wrap gap-2 text-xs text-zinc-500">
        {columns.slice(0, 3).map((col) => {
          if (col.type === 'text' || col.id === firstTextColumn?.id) return null;
          const value = row.cells[col.id];
          if (value === null || value === undefined) return null;
          return (
            <span key={col.id} className="flex items-center gap-1">
              <span className="text-zinc-400">{col.name}:</span>
              <span>{String(value)}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

function addRowToEnumColumn(
  taskId: string,
  enumColumnId: string,
  enumValue: string,
  addRowFn: (afterId: string | null, indent: number) => void
): string {
  // This will add a row with the enum column pre-set
  addRowFn(null, 0);
  return '';
}
'use client';

import { useState, useEffect } from 'react';
import { useTaskStore } from '@/lib/store';
import { t } from '@/lib/i18n';
import type { ColumnDef, ColumnType } from '@/lib/types';
import { ConfirmDialog } from './ConfirmDialog';

interface Props {
  column: ColumnDef | null;
  onClose: () => void;
}

export function ColumnConfigModal({ column, onClose }: Props) {
  const locale = useTaskStore((s) => s.locale);
  const addColumn = useTaskStore((s) => s.addColumn);
  const updateColumn = useTaskStore((s) => s.updateColumn);
  const removeColumn = useTaskStore((s) => s.removeColumn);

  const isEditing = column !== null;

  const [name, setName] = useState(column?.name ?? '');
  const [type, setType] = useState<ColumnType>(column?.type ?? 'text');
  const [enumOptions, setEnumOptions] = useState(column?.options?.join(', ') ?? '');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  useEffect(() => {
    if (column) {
      setName(column.name);
      setType(column.type);
      setEnumOptions(column.options?.join(', ') ?? '');
    } else {
      setName('');
      setType('text');
      setEnumOptions('');
    }
  }, [column]);

  function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) return;

    if (isEditing && column) {
      updateColumn(column.id, {
        name: trimmed,
        type,
        options: type === 'enum' ? enumOptions.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
      });
    } else {
      addColumn({
        id: trimmed.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now(),
        name: trimmed,
        type,
        width: type === 'text' ? 300 : 150,
        options: type === 'enum' ? enumOptions.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
      });
    }
    onClose();
  }

  function handleDelete() {
    setShowConfirmDelete(true);
  }

  function confirmDelete() {
    if (column) {
      removeColumn(column.id);
      onClose();
    }
  }

  return (
    <>
      <ConfirmDialog
        open={showConfirmDelete}
        title={locale === 'zh' ? '确认删除' : 'Confirm Delete'}
        message={t(locale, 'confirmDeleteColumn')}
        locale={locale}
        onConfirm={confirmDelete}
        onCancel={() => setShowConfirmDelete(false)}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl w-80 p-4" onClick={(e) => e.stopPropagation()}>
          <h2 className="text-sm font-semibold mb-3">
            {isEditing ? t(locale, 'configureColumn') : t(locale, 'addColumn')}
          </h2>

          <label className="block text-xs text-zinc-500 mb-1">{t(locale, 'columnName')}</label>
          <input
            className="w-full border border-zinc-300 dark:border-zinc-700 rounded px-2 py-1 text-sm bg-white dark:bg-zinc-800 mb-3"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />

          <label className="block text-xs text-zinc-500 mb-1">{t(locale, 'columnType')}</label>
          <select
            className="w-full border border-zinc-300 dark:border-zinc-700 rounded px-2 py-1 text-sm bg-white dark:bg-zinc-800 mb-3"
            value={type}
            onChange={(e) => setType(e.target.value as ColumnType)}
          >
            <option value="text">{t(locale, 'text')}</option>
            <option value="number">{t(locale, 'number')}</option>
            <option value="datetime">{t(locale, 'datetime')}</option>
            <option value="enum">{t(locale, 'enum')}</option>
            <option value="checkbox">{t(locale, 'checkbox')}</option>
          </select>

          {type === 'enum' && (
            <>
              <label className="block text-xs text-zinc-500 mb-1">{t(locale, 'enumOptions')}</label>
              <input
                className="w-full border border-zinc-300 dark:border-zinc-700 rounded px-2 py-1 text-sm bg-white dark:bg-zinc-800 mb-3"
                value={enumOptions}
                onChange={(e) => setEnumOptions(e.target.value)}
                placeholder="option1, option2, option3"
              />
            </>
          )}

          <div className="flex justify-between">
            <div>
              {isEditing && (
                <button onClick={handleDelete} className="text-xs text-red-500 hover:text-red-700">
                  {t(locale, 'delete')}
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-3 py-1 text-xs rounded border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                {t(locale, 'cancel')}
              </button>
              <button
                onClick={handleSave}
                className="px-3 py-1 text-xs rounded bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300"
              >
                {t(locale, 'save')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

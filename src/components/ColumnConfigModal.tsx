'use client';

import { useState, useEffect, useRef } from 'react';
import { useTaskStore } from '@/lib/store';
import { t } from '@/lib/i18n';
import { toast } from '@/lib/toast-store';
import type { ColumnDef, ColumnType, EnumOption } from '@/lib/types';
import { ConfirmDialog } from './ConfirmDialog';

interface Props {
  column: ColumnDef | null;
  onClose: () => void;
}

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', '#ec4899',
  '#64748b', '#000000',
];

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-6 h-6 rounded-full border-2 border-white dark:border-zinc-800 shadow cursor-pointer hover:scale-110 transition-transform"
        style={{ backgroundColor: value }}
      />
      {open && (
        <div className="absolute z-50 top-8 left-0 p-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg">
          <div className="flex flex-wrap gap-1.5 mb-2" style={{ width: '120px' }}>
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => { onChange(c); setOpen(false); }}
                className="w-5 h-5 rounded-full border border-white dark:border-zinc-700 hover:scale-110 transition-transform"
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-2 py-1 text-xs border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-900"
            placeholder="#000000"
          />
        </div>
      )}
    </div>
  );
}

export function ColumnConfigModal({ column, onClose }: Props) {
  const locale = useTaskStore((s) => s.locale);
  const addColumn = useTaskStore((s) => s.addColumn);
  const updateColumn = useTaskStore((s) => s.updateColumn);
  const removeColumn = useTaskStore((s) => s.removeColumn);

  const isEditing = column !== null;

  const [name, setName] = useState(column?.name ?? '');
  const [type, setType] = useState<ColumnType>(column?.type ?? 'text');
  const [enumOptions, setEnumOptions] = useState<EnumOption[]>(
    column?.options?.map(o => ({ label: o.label, color: o.color })) ?? []
  );
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  useEffect(() => {
    if (column) {
      setName(column.name);
      setType(column.type);
      setEnumOptions(column.options?.map(o => ({ label: o.label, color: o.color })) ?? []);
    } else {
      setName('');
      setType('text');
      setEnumOptions([]);
    }
  }, [column]);

  function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) return;

    if (isEditing && column) {
      updateColumn(column.id, {
        name: trimmed,
        type,
        options: type === 'enum' ? enumOptions.filter(o => o.label.trim()) : undefined,
      });
    } else {
      addColumn({
        id: trimmed.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now(),
        name: trimmed,
        type,
        width: type === 'text' ? 300 : 150,
        options: type === 'enum' ? enumOptions.filter(o => o.label.trim()) : undefined,
      });
    }
    toast.success(t(locale, 'toastSaveSuccess'));
    onClose();
  }

  function handleDelete() {
    setShowConfirmDelete(true);
  }

  function confirmDelete() {
    if (column) {
      removeColumn(column.id);
      toast.success(t(locale, 'toastDeleteSuccess'));
      onClose();
    }
  }

  function updateEnumOption(index: number, field: 'label' | 'color', value: string) {
    const newOptions = [...enumOptions];
    if (field === 'label') {
      newOptions[index] = { ...newOptions[index], label: value };
    } else {
      newOptions[index] = { ...newOptions[index], color: value };
    }
    setEnumOptions(newOptions);
  }

  function addEnumOption() {
    const nextColor = PRESET_COLORS[enumOptions.length % PRESET_COLORS.length];
    setEnumOptions([...enumOptions, { label: '', color: nextColor }]);
  }

  function removeEnumOption(index: number) {
    setEnumOptions(enumOptions.filter((_, i) => i !== index));
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
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl w-96 p-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
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
              <div className="space-y-2 mb-3">
                {enumOptions.map((opt, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <ColorPicker
                      value={opt.color || '#64748b'}
                      onChange={(c) => updateEnumOption(index, 'color', c)}
                    />
                    <input
                      className="flex-1 border border-zinc-300 dark:border-zinc-700 rounded px-2 py-1 text-sm bg-white dark:bg-zinc-800"
                      value={opt.label}
                      onChange={(e) => updateEnumOption(index, 'label', e.target.value)}
                      placeholder={locale === 'zh' ? '选项名称' : 'Option label'}
                    />
                    <button
                      onClick={() => removeEnumOption(index)}
                      className="text-zinc-400 hover:text-red-500 text-sm"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  onClick={addEnumOption}
                  className="text-xs text-blue-500 hover:text-blue-700"
                >
                  + {locale === 'zh' ? '添加选项' : 'Add option'}
                </button>
              </div>
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
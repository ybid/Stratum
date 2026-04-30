'use client';

import { useState, useEffect } from 'react';
import { useTaskStore } from '@/lib/store';
import { useFilterStore, type FilterCondition, type FilterOperator } from '@/lib/filter-store';
import { t } from '@/lib/i18n';

export function AdvancedFilter() {
  const [isOpen, setIsOpen] = useState(false);
  const locale = useTaskStore((s) => s.locale);
  const activeTaskId = useTaskStore((s) => s.activeTaskId);
  const tasks = useTaskStore((s) => s.tasks);
  const columns = tasks.find((task) => task.id === activeTaskId)?.columns ?? [];

  const isAdvancedMode = useFilterStore((s) => s.isAdvancedMode);
  const conditions = useFilterStore((s) => s.conditions);
  const setAdvancedMode = useFilterStore((s) => s.setAdvancedMode);
  const addCondition = useFilterStore((s) => s.addCondition);
  const removeCondition = useFilterStore((s) => s.removeCondition);
  const updateCondition = useFilterStore((s) => s.updateCondition);
  const clearConditions = useFilterStore((s) => s.clearConditions);

  const operators: { value: FilterOperator; label: string }[] = [
    { value: 'contains', label: t(locale, 'filterOperatorContains') },
    { value: 'equals', label: t(locale, 'filterOperatorEquals') },
    { value: 'gt', label: t(locale, 'filterOperatorGt') },
    { value: 'lt', label: t(locale, 'filterOperatorLt') },
    { value: 'isEmpty', label: t(locale, 'filterOperatorIsEmpty') },
    { value: 'isNotEmpty', label: t(locale, 'filterOperatorIsNotEmpty') },
  ];

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-1.5 ${isAdvancedMode ? 'text-blue-500' : 'text-zinc-500'} hover:text-zinc-900 dark:hover:text-zinc-100`}
        title={t(locale, 'advancedFilter')}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full right-0 mt-1 z-50 w-80 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium">
                {t(locale, 'advancedFilter')}
              </span>
              <button
                onClick={() => {
                  setAdvancedMode(!isAdvancedMode);
                  if (!isAdvancedMode) clearConditions();
                }}
                className={`text-xs px-2 py-1 rounded ${isAdvancedMode ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : 'bg-zinc-100 dark:bg-zinc-700'}`}
              >
                {isAdvancedMode ? t(locale, 'filterEnabled') : t(locale, 'filterDisabled')}
              </button>
            </div>

            {isAdvancedMode && (
              <>
                {conditions.length === 0 ? (
                  <p className="text-xs text-zinc-400 mb-2">
                    {t(locale, 'filterNoConditions')}
                  </p>
                ) : (
                  <div className="space-y-2 mb-3">
                    {conditions.map((condition, index) => (
                      <div key={index} className="flex items-center gap-2 text-xs">
                        <select
                          value={condition.columnId}
                          onChange={(e) => updateCondition(index, { columnId: e.target.value })}
                          className="flex-1 border border-zinc-300 dark:border-zinc-600 rounded px-2 py-1 bg-white dark:bg-zinc-900"
                        >
                          {columns.map((col) => (
                            <option key={col.id} value={col.id}>{col.name}</option>
                          ))}
                        </select>
                        <select
                          value={condition.operator}
                          onChange={(e) => updateCondition(index, { operator: e.target.value as FilterOperator })}
                          className="border border-zinc-300 dark:border-zinc-600 rounded px-2 py-1 bg-white dark:bg-zinc-900"
                        >
                          {operators.map((op) => (
                            <option key={op.value} value={op.value}>{op.label}</option>
                          ))}
                        </select>
                        {condition.operator !== 'isEmpty' && condition.operator !== 'isNotEmpty' && (
                          <input
                            type="text"
                            value={condition.value as string ?? ''}
                            onChange={(e) => updateCondition(index, { value: e.target.value })}
                            placeholder="..."
                            className="w-20 border border-zinc-300 dark:border-zinc-600 rounded px-2 py-1 bg-white dark:bg-zinc-900"
                          />
                        )}
                        <button
                          onClick={() => removeCondition(index)}
                          className="text-zinc-400 hover:text-red-500"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => addCondition({ columnId: columns[0]?.id ?? '', operator: 'contains', value: '' })}
                  className="text-xs text-blue-500 hover:text-blue-700"
                  disabled={columns.length === 0}
                >
                  + {t(locale, 'filterAddCondition')}
                </button>

                {conditions.length > 0 && (
                  <button
                    onClick={clearConditions}
                    className="block mt-2 text-xs text-red-500 hover:text-red-700"
                  >
                    {t(locale, 'filterClearAll')}
                  </button>
                )}
              </>
            )}
          </div>
        </>
      )}
    </>
  );
}

// Filter function to apply conditions
export function applyFilters<T extends { cells: Record<string, any> }>(
  rows: T[],
  conditions: FilterCondition[]
): T[] {
  if (conditions.length === 0) return rows;

  return rows.filter((row) => {
    return conditions.every((condition) => {
      const cellValue = row.cells[condition.columnId];
      const filterValue = condition.value;

      switch (condition.operator) {
        case 'contains':
          if (typeof cellValue === 'string') {
            return cellValue.toLowerCase().includes(String(filterValue).toLowerCase());
          }
          return false;
        case 'equals':
          return cellValue === filterValue;
        case 'gt':
          return typeof cellValue === 'number' && cellValue > Number(filterValue);
        case 'lt':
          return typeof cellValue === 'number' && cellValue < Number(filterValue);
        case 'isEmpty':
          return cellValue === null || cellValue === undefined || cellValue === '';
        case 'isNotEmpty':
          return cellValue !== null && cellValue !== undefined && cellValue !== '';
        default:
          return true;
      }
    });
  });
}
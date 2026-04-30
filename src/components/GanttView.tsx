'use client';

import { useState, useMemo } from 'react';
import { useTaskStore } from '@/lib/store';
import { t } from '@/lib/i18n';
import type { TaskRow as TaskRowType } from '@/lib/types';

const MONTHS_ZH = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function GanttView() {
  const [viewRange, setViewRange] = useState<'week' | 'month' | 'quarter'>('month');
  const activeTaskId = useTaskStore((s) => s.activeTaskId);
  const tasks = useTaskStore((s) => s.tasks);
  const locale = useTaskStore((s) => s.locale);

  const activeTask = tasks.find((t) => t.id === activeTaskId);
  const datetimeColumn = activeTask?.columns.find((c) => c.type === 'datetime');
  const textColumn = activeTask?.columns.find((c) => c.type === 'text');

  const rowsWithDates = useMemo(() => {
    if (!activeTask || !datetimeColumn) return [];
    return activeTask.rows
      .filter((row) => {
        const val = row.cells[datetimeColumn.id];
        return val && typeof val === 'string' && val.length >= 10;
      })
      .map((row) => {
        const dateStr = String(row.cells[datetimeColumn.id]);
        const date = new Date(dateStr);
        const title = textColumn ? String(row.cells[textColumn.id] || '') : '';
        return { ...row, date, title };
      })
      .filter((row) => !isNaN(row.date.getTime()))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [activeTask, datetimeColumn, textColumn]);

  const today = new Date();
  const months = locale === 'zh' ? MONTHS_ZH : MONTHS_EN;

  // Calculate date range
  const startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const endDate = new Date(today.getFullYear(), today.getMonth() + 3, 0);
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  const dayWidth = viewRange === 'week' ? 40 : viewRange === 'month' ? 12 : 6;
  const totalWidth = totalDays * dayWidth;

  function getBarPosition(date: Date) {
    const daysDiff = Math.floor((date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff * dayWidth;
  }

  function getBarWidth() {
    // Default bar width of 3 days worth
    return 3 * dayWidth;
  }

  // Generate month headers
  const monthHeaders: { label: string; start: number; width: number }[] = [];
  let currentMonth = startDate.getMonth();
  let currentYear = startDate.getFullYear();
  let lastPos = 0;

  while (currentYear < endDate.getFullYear() || currentMonth <= endDate.getMonth()) {
    const monthStart = new Date(currentYear, currentMonth, 1);
    const monthEnd = new Date(currentYear, currentMonth + 1, 0);
    const monthStartDiff = Math.max(0, Math.floor((monthStart.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const monthEndDiff = Math.floor((monthEnd.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const width = (monthEndDiff - monthStartDiff + 1) * dayWidth;

    monthHeaders.push({
      label: `${months[currentMonth]} ${currentYear}`,
      start: monthStartDiff * dayWidth,
      width,
    });

    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
  }

  return (
    <div className="flex-1 overflow-auto p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">
          {locale === 'zh' ? '甘特图' : 'Gantt Chart'}
        </h2>
        <div className="flex items-center gap-1 text-xs">
          <button
            onClick={() => setViewRange('week')}
            className={`px-2 py-1 rounded ${viewRange === 'week' ? 'bg-blue-100 dark:bg-blue-900 text-blue-600' : 'bg-zinc-100 dark:bg-zinc-800'}`}
          >
            {locale === 'zh' ? '周' : 'Week'}
          </button>
          <button
            onClick={() => setViewRange('month')}
            className={`px-2 py-1 rounded ${viewRange === 'month' ? 'bg-blue-100 dark:bg-blue-900 text-blue-600' : 'bg-zinc-100 dark:bg-zinc-800'}`}
          >
            {locale === 'zh' ? '月' : 'Month'}
          </button>
          <button
            onClick={() => setViewRange('quarter')}
            className={`px-2 py-1 rounded ${viewRange === 'quarter' ? 'bg-blue-100 dark:bg-blue-900 text-blue-600' : 'bg-zinc-100 dark:bg-zinc-800'}`}
          >
            {locale === 'zh' ? '季度' : 'Quarter'}
          </button>
        </div>
      </div>

      {!datetimeColumn ? (
        <div className="text-center text-zinc-400 py-8">
          {locale === 'zh' ? '添加日期时间列来使用甘特图视图' : 'Add a datetime column to use Gantt view'}
        </div>
      ) : rowsWithDates.length === 0 ? (
        <div className="text-center text-zinc-400 py-8">
          {locale === 'zh' ? '没有带日期的任务' : 'No tasks with dates'}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div style={{ minWidth: Math.max(600, totalWidth + 200) }}>
            {/* Month headers */}
            <div className="flex border-b border-zinc-200 dark:border-zinc-700 mb-4">
              <div className="w-48 shrink-0" />
              <div className="relative" style={{ width: totalWidth }}>
                {monthHeaders.map((m, i) => (
                  <div
                    key={i}
                    className="absolute top-0 bottom-0 text-xs text-zinc-500 border-l border-zinc-200 dark:border-zinc-700 px-1 flex items-center"
                    style={{ left: m.start, width: m.width }}
                  >
                    {m.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Task rows */}
            <div className="relative">
              {/* Today line */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-red-400 z-10"
                style={{ left: 192 + getBarPosition(today) }}
              />

              {rowsWithDates.map((row) => (
                <div key={row.id} className="flex items-center h-10 border-b border-zinc-100 dark:border-zinc-800">
                  {/* Task name */}
                  <div className="w-48 shrink-0 px-2 text-sm truncate" title={row.title}>
                    {row.title || (locale === 'zh' ? '无标题' : 'Untitled')}
                  </div>

                  {/* Gantt bar */}
                  <div className="relative h-6" style={{ width: totalWidth }}>
                    <div
                      className="absolute top-1 h-4 bg-blue-500 dark:bg-blue-600 rounded"
                      style={{
                        left: getBarPosition(row.date),
                        width: getBarWidth(),
                      }}
                      title={`${row.title}: ${row.date.toLocaleDateString()}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
'use client';

import { useState, useMemo } from 'react';
import { useTaskStore } from '@/lib/store';
import { t } from '@/lib/i18n';
import type { TaskRow as TaskRowType } from '@/lib/types';

const MONTHS_ZH = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS_ZH = ['日', '一', '二', '三', '四', '五', '六'];
const DAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const activeTaskId = useTaskStore((s) => s.activeTaskId);
  const tasks = useTaskStore((s) => s.tasks);
  const locale = useTaskStore((s) => s.locale);

  const activeTask = tasks.find((t) => t.id === activeTaskId);
  const datetimeColumn = activeTask?.columns.find((c) => c.type === 'datetime');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const days = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = firstDay.getDay();
    const totalDays = lastDay.getDate();

    const result: { date: Date | null; rows: TaskRowType[] }[] = [];

    // Padding for start of month
    for (let i = 0; i < startPadding; i++) {
      result.push({ date: null, rows: [] });
    }

    // Days of month
    if (activeTask && datetimeColumn) {
      for (let d = 1; d <= totalDays; d++) {
        const date = new Date(year, month, d);
        const dateStr = date.toISOString().slice(0, 10);
        const rowsWithDate = activeTask.rows.filter((row) => {
          const cellValue = row.cells[datetimeColumn.id];
          if (typeof cellValue === 'string') {
            return cellValue.startsWith(dateStr);
          }
          return false;
        });
        result.push({ date, rows: rowsWithDate });
      }
    } else {
      for (let d = 1; d <= totalDays; d++) {
        result.push({ date: new Date(year, month, d), rows: [] });
      }
    }

    return result;
  }, [year, month, activeTask, datetimeColumn]);

  const months = locale === 'zh' ? MONTHS_ZH : MONTHS_EN;
  const weekDays = locale === 'zh' ? DAYS_ZH : DAYS_EN;

  function prevMonth() {
    setCurrentDate(new Date(year, month - 1, 1));
  }

  function nextMonth() {
    setCurrentDate(new Date(year, month + 1, 1));
  }

  function goToday() {
    setCurrentDate(new Date());
  }

  return (
    <div className="flex-1 overflow-auto p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">
            {months[month]} {year}
          </h2>
          <div className="flex items-center gap-1">
            <button onClick={prevMonth} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded">
              ←
            </button>
            <button onClick={goToday} className="px-2 py-1 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded">
              {locale === 'zh' ? '今天' : 'Today'}
            </button>
            <button onClick={nextMonth} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded">
              →
            </button>
          </div>
        </div>
        {!datetimeColumn && (
          <span className="text-sm text-zinc-400">
            {locale === 'zh' ? '添加日期时间列来使用日历视图' : 'Add a datetime column to use calendar view'}
          </span>
        )}
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-px mb-1">
        {weekDays.map((day) => (
          <div key={day} className="text-center text-xs font-medium text-zinc-500 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px bg-zinc-200 dark:bg-zinc-700 rounded-lg overflow-hidden">
        {days.map((day, index) => (
          <div
            key={index}
            className={`min-h-24 bg-white dark:bg-zinc-900 p-1 ${
              day.date && day.date.toDateString() === new Date().toDateString()
                ? 'ring-2 ring-blue-500'
                : ''
            }`}
          >
            {day.date && (
              <>
                <div className="text-xs text-zinc-400 mb-1">{day.date.getDate()}</div>
                <div className="space-y-1">
                  {day.rows.slice(0, 3).map((row) => {
                    const textCol = activeTask?.columns.find((c) => c.type === 'text');
                    const title = textCol ? String(row.cells[textCol.id] || '') : '';
                    return (
                      <div
                        key={row.id}
                        className="text-xs px-1 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded truncate"
                        title={title}
                      >
                        {title || (locale === 'zh' ? '无标题' : 'Untitled')}
                      </div>
                    );
                  })}
                  {day.rows.length > 3 && (
                    <div className="text-xs text-zinc-400">
                      +{day.rows.length - 3}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
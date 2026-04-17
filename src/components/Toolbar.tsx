'use client';

import { useTaskStore } from '@/lib/store';
import { t } from '@/lib/i18n';
import type { ViewMode, Locale } from '@/lib/types';

export function Toolbar() {
  const viewMode = useTaskStore((s) => s.viewMode);
  const locale = useTaskStore((s) => s.locale);
  const sidebarOpen = useTaskStore((s) => s.sidebarOpen);
  const setViewMode = useTaskStore((s) => s.setViewMode);
  const setLocale = useTaskStore((s) => s.setLocale);
  const toggleSidebar = useTaskStore((s) => s.toggleSidebar);

  return (
    <header className="flex items-center justify-between px-4 h-10 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 shrink-0">
      <div className="flex items-center gap-1">
        <button
          onClick={toggleSidebar}
          className="mr-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          title="Toggle sidebar"
        >
          {sidebarOpen ? '☰' : '☰'}
        </button>
        <h1 className="text-sm font-semibold mr-4">Stratum</h1>
        <ViewModeButton mode="outline" current={viewMode} onClick={setViewMode} locale={locale} />
        <ViewModeButton mode="flat" current={viewMode} onClick={setViewMode} locale={locale} />
      </div>
      <button
        onClick={() => setLocale(locale === 'zh' ? 'en' : 'zh')}
        className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
      >
        {locale === 'zh' ? '中文' : 'EN'}
      </button>
    </header>
  );
}

function ViewModeButton({
  mode,
  current,
  onClick,
  locale,
}: {
  mode: ViewMode;
  current: ViewMode;
  onClick: (m: ViewMode) => void;
  locale: Locale;
}) {
  const active = mode === current;
  return (
    <button
      onClick={() => onClick(mode)}
      className={`px-2 py-0.5 text-xs rounded transition-colors ${
        active
          ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100'
          : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
      }`}
    >
      {t(locale, mode)}
    </button>
  );
}

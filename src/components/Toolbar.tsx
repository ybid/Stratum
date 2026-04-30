'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTaskStore } from '@/lib/store';
import { t } from '@/lib/i18n';
import { toast } from '@/lib/toast-store';
import { ThemeSwitcher } from './ThemeSwitcher';
import { QuickAdd } from './QuickAdd';
import { AdvancedFilter } from './AdvancedFilter';
import { UserMenu } from './UserMenu';
import { useCommandStore } from '@/lib/command-store';
import type { ViewMode, Locale } from '@/lib/types';

export function Toolbar() {
  const viewMode = useTaskStore((s) => s.viewMode);
  const locale = useTaskStore((s) => s.locale);
  const sidebarOpen = useTaskStore((s) => s.sidebarOpen);
  const filter = useTaskStore((s) => s.filter);
  const setViewMode = useTaskStore((s) => s.setViewMode);
  const setLocale = useTaskStore((s) => s.setLocale);
  const toggleSidebar = useTaskStore((s) => s.toggleSidebar);
  const setFilter = useTaskStore((s) => s.setFilter);
  const collapseAll = useTaskStore((s) => s.collapseAll);
  const expandAll = useTaskStore((s) => s.expandAll);
  const exportData = useTaskStore((s) => s.exportData);
  const importData = useTaskStore((s) => s.importData);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const undo = useCallback(() => useTaskStore.getState().undo(), []);
  const redo = useCallback(() => useTaskStore.getState().redo(), []);
  const canUndo = useTaskStore((s) => s.canUndo);
  const canRedo = useTaskStore((s) => s.canRedo);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          redo();
          toast.info(t(locale, 'toastRedoSuccess'));
        } else {
          e.preventDefault();
          undo();
          toast.info(t(locale, 'toastUndoSuccess'));
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, locale]);

  function handleExport() {
    try {
      const json = exportData();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `stratum-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(t(locale, 'toastExportSuccess'));
    } catch {
      toast.error(t(locale, 'toastExportError'));
    }
  }

  function handleImport() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        if (!importData(text)) {
          toast.error(t(locale, 'toastImportError'));
        } else {
          toast.success(t(locale, 'toastImportSuccess'));
        }
      } catch {
        toast.error(t(locale, 'toastImportError'));
      }
    };
    input.click();
  }

  return (
    <header className="flex items-center justify-between px-4 h-10 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 shrink-0">
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={toggleSidebar}
          className="mr-2 p-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          title="Toggle sidebar"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <line x1="9" y1="3" x2="9" y2="21"/>
          </svg>
        </button>
        <h1 className="text-sm font-semibold mr-4">Stratum</h1>

        <select
          value={viewMode}
          onChange={(e) => setViewMode(e.target.value as ViewMode)}
          className="px-2 py-1 text-xs border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 outline-none"
        >
          <option value="outline">{locale === 'zh' ? '大纲' : 'Outline'}</option>
          <option value="flat">{locale === 'zh' ? '平铺' : 'Flat'}</option>
          <option value="kanban">{locale === 'zh' ? '看板' : 'Kanban'}</option>
          <option value="calendar">{locale === 'zh' ? '日历' : 'Calendar'}</option>
          <option value="gantt">{locale === 'zh' ? '甘特图' : 'Gantt'}</option>
        </select>

        <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-600 mx-2" />

        <button
          onClick={undo}
          disabled={!canUndo()}
          className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed"
          title="Undo (Ctrl+Z)"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 10h10a5 5 0 0 1 5 5v2"/>
            <path d="M3 10l4-4M3 10l4 4"/>
          </svg>
        </button>
        <button
          onClick={redo}
          disabled={!canRedo()}
          className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed"
          title="Redo (Ctrl+Shift+Z)"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 10H11a5 5 0 0 0-5 5v2"/>
            <path d="M21 10l-4-4M21 10l-4 4"/>
          </svg>
        </button>

        <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-600 mx-2" />

        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          title={locale === 'zh' ? '更多' : 'More'}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/>
          </svg>
        </button>
        {showMenu && (
          <div ref={menuRef} className="absolute top-10 left-44 z-50 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded shadow-lg py-1 min-w-[160px]">
            <button
              onClick={() => { collapseAll(); setShowMenu(false); }}
              className="w-full text-left px-3 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700"
            >
              {locale === 'zh' ? '全部折叠' : 'Collapse All'}
            </button>
            <button
              onClick={() => { expandAll(); setShowMenu(false); }}
              className="w-full text-left px-3 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700"
            >
              {locale === 'zh' ? '全部展开' : 'Expand All'}
            </button>
            <div className="border-t border-zinc-200 dark:border-zinc-700 my-1" />
            <button
              onClick={() => { handleImport(); setShowMenu(false); }}
              className="w-full text-left px-3 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700"
            >
              {locale === 'zh' ? '导入 JSON' : 'Import JSON'}
            </button>
            <button
              onClick={() => { handleExport(); setShowMenu(false); }}
              className="w-full text-left px-3 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700"
            >
              {locale === 'zh' ? '导出 JSON' : 'Export JSON'}
            </button>
            <div className="border-t border-zinc-200 dark:border-zinc-700 my-1" />
            <button
              onClick={() => { setShowShortcuts(true); setShowMenu(false); }}
              className="w-full text-left px-3 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700"
            >
              {locale === 'zh' ? '快捷键' : 'Keyboard Shortcuts'}
            </button>
          </div>
        )}

        <QuickAdd />
        <ThemeSwitcher />
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <AdvancedFilter />
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder={locale === 'zh' ? '搜索...' : 'Search...'}
          className="w-32 px-2 py-1 text-xs border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 outline-none focus:border-blue-500"
        />
        <button
          onClick={() => setLocale(locale === 'zh' ? 'en' : 'zh')}
          className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        >
          {locale === 'zh' ? '中文' : 'EN'}
        </button>
        <UserMenu />
      </div>

      {showShortcuts && (
        <ShortcutsHelp onClose={() => setShowShortcuts(false)} locale={locale} />
      )}
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
      className={`px-2 py-1 text-xs rounded transition-colors ${
        active
          ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100'
          : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
      }`}
    >
      {t(locale, mode)}
    </button>
  );
}

function ShortcutsHelp({ onClose, locale }: { onClose: () => void; locale: Locale }) {
  const shortcuts = [
    { keys: 'Enter', desc: locale === 'zh' ? '在下方添加行' : 'Add row below' },
    { keys: 'Tab', desc: locale === 'zh' ? '增加缩进' : 'Indent row' },
    { keys: 'Shift+Tab', desc: locale === 'zh' ? '减少缩进' : 'Outdent row' },
    { keys: 'Backspace', desc: locale === 'zh' ? '空单元格时减少缩进/删除行' : 'Outdent/delete row when cell empty' },
    { keys: 'Ctrl+Z', desc: locale === 'zh' ? '撤销' : 'Undo' },
    { keys: 'Ctrl+Shift+Z', desc: locale === 'zh' ? '重做' : 'Redo' },
    { keys: 'Ctrl+点击', desc: locale === 'zh' ? '多选切换' : 'Toggle selection' },
    { keys: 'Shift+点击', desc: locale === 'zh' ? '范围选择' : 'Range selection' },
  ];

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="fixed top-12 right-4 z-50 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg p-4 text-sm min-w-[280px]">
        <h3 className="font-semibold mb-3">{locale === 'zh' ? '快捷键' : 'Keyboard Shortcuts'}</h3>
        <div className="space-y-2">
          {shortcuts.map((s) => (
            <div key={s.keys} className="flex justify-between gap-4">
              <kbd className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-700 rounded text-xs font-mono">{s.keys}</kbd>
              <span className="text-zinc-600 dark:text-zinc-400 text-xs">{s.desc}</span>
            </div>
          ))}
        </div>
        <button
          onClick={onClose}
          className="mt-3 w-full px-2 py-1 text-xs rounded border border-zinc-300 dark:border-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-700"
        >
          {locale === 'zh' ? '关闭' : 'Close'}
        </button>
      </div>
    </>
  );
}
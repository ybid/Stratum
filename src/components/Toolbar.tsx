'use client';

import { useState, useEffect, useRef } from 'react';
import { useTaskStore } from '@/lib/store';
import { t } from '@/lib/i18n';
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
  const undo = useTaskStore((s) => s.undo);
  const redo = useTaskStore((s) => s.redo);
  const canUndo = useTaskStore((s) => s.canUndo);
  const canRedo = useTaskStore((s) => s.canRedo);
  const collapseAll = useTaskStore((s) => s.collapseAll);
  const expandAll = useTaskStore((s) => s.expandAll);
  const exportData = useTaskStore((s) => s.exportData);
  const importData = useTaskStore((s) => s.importData);
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          redo();
        } else {
          e.preventDefault();
          undo();
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  function handleExport() {
    const json = exportData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stratum-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImport() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      if (!importData(text)) {
        alert(locale === 'zh' ? '导入失败：无效的文件格式' : 'Import failed: invalid file format');
      }
    };
    input.click();
  }

  return (
    <header className="flex items-center justify-between px-4 h-10 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 shrink-0">
      <div className="flex items-center gap-1">
        <button
          onClick={toggleSidebar}
          className="mr-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          title="Toggle sidebar"
        >
          ☰
        </button>
        <h1 className="text-sm font-semibold mr-4">Stratum</h1>
        <ViewModeButton mode="outline" current={viewMode} onClick={setViewMode} locale={locale} />
        <ViewModeButton mode="flat" current={viewMode} onClick={setViewMode} locale={locale} />

        <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-600 mx-2" />

        <button
          onClick={undo}
          disabled={!canUndo()}
          className="px-1.5 py-0.5 text-xs rounded text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed"
          title="Undo (Ctrl+Z)"
        >
          ↶
        </button>
        <button
          onClick={redo}
          disabled={!canRedo()}
          className="px-1.5 py-0.5 text-xs rounded text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed"
          title="Redo (Ctrl+Shift+Z)"
        >
          ↷
        </button>

        <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-600 mx-2" />

        <button
          onClick={collapseAll}
          className="px-1.5 py-0.5 text-xs rounded text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          title={locale === 'zh' ? '全部折叠' : 'Collapse All'}
        >
          ▸▸
        </button>
        <button
          onClick={expandAll}
          className="px-1.5 py-0.5 text-xs rounded text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          title={locale === 'zh' ? '全部展开' : 'Expand All'}
        >
          ▾▾
        </button>

        <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-600 mx-2" />

        <button
          onClick={handleImport}
          className="px-1.5 py-0.5 text-xs rounded text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          title={locale === 'zh' ? '导入' : 'Import'}
        >
          ↑↓
        </button>
        <button
          onClick={handleExport}
          className="px-1.5 py-0.5 text-xs rounded text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          title={locale === 'zh' ? '导出' : 'Export'}
        >
          ↓↑
        </button>

        <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-600 mx-2" />

        <button
          onClick={() => setShowShortcuts(!showShortcuts)}
          className="px-1.5 py-0.5 text-xs rounded text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          title={locale === 'zh' ? '快捷键' : 'Shortcuts'}
        >
          ⌨
        </button>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder={locale === 'zh' ? '搜索...' : 'Search...'}
          className="w-32 px-2 py-0.5 text-xs border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 outline-none focus:border-blue-500"
        />
        <button
          onClick={() => setLocale(locale === 'zh' ? 'en' : 'zh')}
          className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        >
          {locale === 'zh' ? '中文' : 'EN'}
        </button>
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

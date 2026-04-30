'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useCommandStore, getFilteredCommands, type Command } from '@/lib/command-store';
import { useTaskStore } from '@/lib/store';
import { t } from '@/lib/i18n';

export function CommandPalette() {
  const isOpen = useCommandStore((s) => s.isOpen);
  const query = useCommandStore((s) => s.query);
  const setQuery = useCommandStore((s) => s.setQuery);
  const close = useCommandStore((s) => s.close);
  const commands = useCommandStore((s) => s.commands);
  const selectedIndex = useCommandStore((s) => s.selectedIndex);
  const setSelectedIndex = useCommandStore((s) => s.setSelectedIndex);
  const executeCommand = useCommandStore((s) => s.execute);

  const locale = useTaskStore((s) => s.locale);
  const directories = useTaskStore((s) => s.directories);
  const tasks = useTaskStore((s) => s.tasks);
  const setActiveTask = useTaskStore((s) => s.setActiveTask);
  const toggleSidebar = useTaskStore((s) => s.toggleSidebar);
  const setViewMode = useTaskStore((s) => s.setViewMode);
  const exportData = useTaskStore((s) => s.exportData);
  const collapseAll = useTaskStore((s) => s.collapseAll);
  const expandAll = useTaskStore((s) => s.expandAll);
  const undo = useTaskStore((s) => s.undo);
  const redo = useTaskStore((s) => s.redo);

  const inputRef = useRef<HTMLInputElement>(null);

  // Build commands dynamically when opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      useCommandStore.setState({
        commands: buildCommands(locale, directories, tasks, setActiveTask, toggleSidebar, setViewMode, exportData, collapseAll, expandAll, undo, redo),
      });
    }
  }, [isOpen, locale, directories, tasks, setActiveTask, toggleSidebar, setViewMode, exportData, collapseAll, expandAll, undo, redo]);

  const filtered = getFilteredCommands(commands, query);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(Math.min(selectedIndex + 1, filtered.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(Math.max(selectedIndex - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        executeCommand(selectedIndex);
      } else if (e.key === 'Escape') {
        close();
      }
    },
    [filtered.length, selectedIndex, setSelectedIndex, executeCommand, close]
  );

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40" onClick={close} />
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg">
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
          {/* Search input */}
          <div className="flex items-center px-4 py-3 border-b border-zinc-200 dark:border-zinc-700">
            <svg className="w-5 h-5 text-zinc-400 mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t(locale, 'commandPalettePlaceholder')}
              className="flex-1 bg-transparent outline-none text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400"
            />
            <kbd className="px-1.5 py-0.5 text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded">ESC</kbd>
          </div>

          {/* Results */}
          <div className="max-h-80 overflow-y-auto py-2">
            {filtered.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-zinc-400">
                {t(locale, 'commandNoResults')}
              </div>
            ) : (
              filtered.map((cmd, index) => (
                <button
                  key={cmd.id}
                  onClick={() => executeCommand(index)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full flex items-center px-4 py-2 text-sm text-left transition-colors ${
                    index === selectedIndex
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      : 'text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                  }`}
                >
                  <span className="mr-3 text-zinc-400">{cmd.icon}</span>
                  <span className="flex-1">{cmd.label}</span>
                  {cmd.shortcut && (
                    <kbd className="text-xs text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                      {cmd.shortcut}
                    </kbd>
                  )}
                </button>
              ))
            )}
          </div>

          {/* Footer hint */}
          <div className="px-4 py-2 border-t border-zinc-200 dark:border-zinc-700 text-xs text-zinc-400 flex items-center gap-4">
            <span>↑↓ {t(locale, 'cmdNavigate')}</span>
            <span>↵ {t(locale, 'cmdExecute')}</span>
            <span>ESC {t(locale, 'cmdClose')}</span>
          </div>
        </div>
      </div>
    </>
  );
}

function buildCommands(
  locale: 'zh' | 'en',
  directories: { id: string; name: string }[],
  tasks: { id: string; directoryId: string; name: string }[],
  setActiveTask: (id: string) => void,
  toggleSidebar: () => void,
  setViewMode: (mode: 'outline' | 'flat') => void,
  exportData: () => string,
  collapseAll: () => void,
  expandAll: () => void,
  undo: () => void,
  redo: () => void
): Command[] {
  const commands: Command[] = [];

  // Navigation
  commands.push({
    id: 'nav-sidebar',
    label: locale === 'zh' ? '切换侧边栏' : 'Toggle Sidebar',
    icon: '📁',
    shortcut: 'Ctrl+B',
    category: 'navigation',
    action: toggleSidebar,
  });

  commands.push({
    id: 'view-outline',
    label: locale === 'zh' ? '大纲视图' : 'Outline View',
    icon: '📋',
    category: 'navigation',
    action: () => setViewMode('outline'),
  });

  commands.push({
    id: 'view-flat',
    label: locale === 'zh' ? '扁平视图' : 'Flat View',
    icon: '📃',
    category: 'navigation',
    action: () => setViewMode('flat'),
  });

  // Actions
  commands.push({
    id: 'action-undo',
    label: locale === 'zh' ? '撤销' : 'Undo',
    icon: '↩️',
    shortcut: 'Ctrl+Z',
    category: 'action',
    action: undo,
  });

  commands.push({
    id: 'action-redo',
    label: locale === 'zh' ? '重做' : 'Redo',
    icon: '↪️',
    shortcut: 'Ctrl+Shift+Z',
    category: 'action',
    action: redo,
  });

  commands.push({
    id: 'action-collapse',
    label: locale === 'zh' ? '折叠所有' : 'Collapse All',
    icon: '🔽',
    category: 'action',
    action: collapseAll,
  });

  commands.push({
    id: 'action-expand',
    label: locale === 'zh' ? '展开所有' : 'Expand All',
    icon: '🔼',
    category: 'action',
    action: expandAll,
  });

  commands.push({
    id: 'action-export',
    label: locale === 'zh' ? '导出数据' : 'Export Data',
    icon: '📤',
    category: 'action',
    action: () => {
      const json = exportData();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `stratum-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    },
  });

  // Directories and Tasks
  for (const dir of directories) {
    const dirTasks = tasks.filter((t) => t.directoryId === dir.id);
    if (dirTasks.length > 0) {
      commands.push({
        id: `nav-dir-${dir.id}`,
        label: `📁 ${dir.name}`,
        category: 'navigation',
        action: () => {},
      });
      for (const task of dirTasks) {
        commands.push({
          id: `nav-task-${task.id}`,
          label: `  📋 ${task.name}`,
          category: 'navigation',
          action: () => setActiveTask(task.id),
        });
      }
    }
  }

  return commands;
}
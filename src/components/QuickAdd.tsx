'use client';

import { useState, useEffect, useRef } from 'react';
import { useTaskStore } from '@/lib/store';
import { t } from '@/lib/i18n';
import { toast } from '@/lib/toast-store';

export function QuickAdd() {
  const [isOpen, setIsOpen] = useState(false);
  const [taskName, setTaskName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const locale = useTaskStore((s) => s.locale);
  const directories = useTaskStore((s) => s.directories);
  const tasks = useTaskStore((s) => s.tasks);
  const activeTaskId = useTaskStore((s) => s.activeTaskId);
  const addDirectory = useTaskStore((s) => s.addDirectory);
  const addTask = useTaskStore((s) => s.addTask);
  const addRow = useTaskStore((s) => s.addRow);

  // Ctrl+N shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        setIsOpen(true);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  function handleSubmit() {
    const name = taskName.trim();
    if (!name) {
      setIsOpen(false);
      return;
    }

    // If there's an active task, add a row to it
    if (activeTaskId) {
      addRow(null, 0);
      toast.success(t(locale, 'toastAddSuccess'));
    } else if (directories.length === 0) {
      // Create a directory and task if none exist
      addDirectory(locale === 'zh' ? '默认目录' : 'Default');
      // Get the new directory (last one added)
      const dirs = useTaskStore.getState().directories;
      const newDir = dirs[dirs.length - 1];
      if (newDir) {
        addTask(newDir.id, name);
        toast.success(t(locale, 'toastAddSuccess'));
      }
    } else {
      // Add to first task's first column
      const firstTask = tasks[0];
      if (firstTask) {
        useTaskStore.getState().setActiveTask(firstTask.id);
        addRow(null, 0);
        toast.success(t(locale, 'toastAddSuccess'));
      }
    }

    setTaskName('');
    setIsOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      handleSubmit();
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setTaskName('');
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
        title={locale === 'zh' ? '快速添加 (Ctrl+N)' : 'Quick Add (Ctrl+N)'}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-50 bg-black/40" onClick={() => setIsOpen(false)} />
          <div className="fixed top-1/3 left-1/2 -translate-x-1/2 z-50 w-full max-w-md">
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
              <div className="flex items-center px-4 py-3">
                <svg className="w-5 h-5 text-zinc-400 mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <input
                  ref={inputRef}
                  type="text"
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t(locale, 'quickAddPlaceholder')}
                  className="flex-1 bg-transparent outline-none text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400"
                />
                <kbd className="px-1.5 py-0.5 text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded">ESC</kbd>
              </div>
              <div className="px-4 py-2 border-t border-zinc-200 dark:border-zinc-700 text-xs text-zinc-400">
                {t(locale, 'quickAddHint')}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
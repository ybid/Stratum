'use client';

import { useState } from 'react';
import { useTaskStore } from '@/lib/store';
import { t } from '@/lib/i18n';
import { toast } from '@/lib/toast-store';
import type { Directory } from '@/lib/types';
import { ConfirmDialog } from './ConfirmDialog';

export function Sidebar() {
  const directories = useTaskStore((s) => s.directories);
  const tasks = useTaskStore((s) => s.tasks);
  const activeTaskId = useTaskStore((s) => s.activeTaskId);
  const sidebarOpen = useTaskStore((s) => s.sidebarOpen);
  const locale = useTaskStore((s) => s.locale);
  const addDirectory = useTaskStore((s) => s.addDirectory);
  const removeDirectory = useTaskStore((s) => s.removeDirectory);
  const renameDirectory = useTaskStore((s) => s.renameDirectory);
  const toggleDirectoryCollapse = useTaskStore((s) => s.toggleDirectoryCollapse);
  const addTask = useTaskStore((s) => s.addTask);
  const removeTask = useTaskStore((s) => s.removeTask);
  const renameTask = useTaskStore((s) => s.renameTask);
  const setActiveTask = useTaskStore((s) => s.setActiveTask);

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [renameType, setRenameType] = useState<'directory' | 'task'>('directory');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; type: 'directory' | 'task'; id: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'directory' | 'task'; id: string } | null>(null);

  const confirmMessage = confirmDelete?.type === 'directory'
    ? t(locale, 'confirmDeleteDirectory')
    : t(locale, 'confirmDeleteTask');

  function handleContextMenu(e: React.MouseEvent, type: 'directory' | 'task', id: string) {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, type, id });
  }

  function closeContextMenu() {
    setContextMenu(null);
  }

  function startRename(type: 'directory' | 'task', id: string) {
    const name = type === 'directory'
      ? directories.find((d) => d.id === id)?.name ?? ''
      : tasks.find((t) => t.id === id)?.name ?? '';
    setRenamingId(id);
    setRenameValue(name);
    setRenameType(type);
    setContextMenu(null);
  }

  function commitRename() {
    if (!renamingId) return;
    const trimmed = renameValue.trim();
    if (trimmed) {
      if (renameType === 'directory') renameDirectory(renamingId, trimmed);
      else renameTask(renamingId, trimmed);
    }
    setRenamingId(null);
  }

  return (
    <>
      <ConfirmDialog
        open={!!confirmDelete}
        title={locale === 'zh' ? '确认删除' : 'Confirm Delete'}
        message={confirmMessage}
        locale={locale}
        onConfirm={() => {
          if (confirmDelete) {
            if (confirmDelete.type === 'directory') removeDirectory(confirmDelete.id);
            else removeTask(confirmDelete.id);
            toast.success(t(locale, 'toastDeleteSuccess'));
          }
          setConfirmDelete(null);
        }}
        onCancel={() => setConfirmDelete(null)}
      />
      <aside
        className={`shrink-0 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex flex-col h-full select-none transition-all duration-200 ease-in-out ${
          sidebarOpen ? 'w-60 opacity-100' : 'w-0 opacity-0 overflow-hidden'
        }`}
      >
        {sidebarOpen && (
          <>
            <div className="flex items-center justify-between px-3 h-10 border-b border-zinc-200 dark:border-zinc-800">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                {t(locale, 'directory')}
              </span>
              <button
                onClick={() => {
                  addDirectory(t(locale, 'directory'));
                  toast.success(t(locale, 'toastAddSuccess'));
                }}
                className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                title={t(locale, 'addDirectory')}
              >
                +
              </button>
            </div>

            <div className="flex-1 overflow-auto py-1" onClick={closeContextMenu}>
              {directories.map((dir) => (
                <div key={dir.id}>
                  <DirectoryItem
                    dir={dir}
                    locale={locale}
                    isRenaming={renamingId === dir.id && renameType === 'directory'}
                    renameValue={renameValue}
                    onToggle={() => toggleDirectoryCollapse(dir.id)}
                    onContextMenu={(e) => handleContextMenu(e, 'directory', dir.id)}
                    onRenameChange={setRenameValue}
                    onRenameCommit={commitRename}
                    onRenameCancel={() => setRenamingId(null)}
                  />
                  {!dir.collapsed &&
                    tasks
                      .filter((task) => task.directoryId === dir.id)
                      .map((task) => (
                        <TaskItem
                          key={task.id}
                          name={task.name}
                          active={task.id === activeTaskId}
                          isRenaming={renamingId === task.id && renameType === 'task'}
                          renameValue={renameValue}
                          onClick={() => setActiveTask(task.id)}
                          onContextMenu={(e) => handleContextMenu(e, 'task', task.id)}
                          onRenameChange={setRenameValue}
                          onRenameCommit={commitRename}
                          onRenameCancel={() => setRenamingId(null)}
                        />
                      ))}
                </div>
              ))}
            </div>
          </>
        )}
      </aside>
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          locale={locale}
          onRename={() => startRename(contextMenu.type, contextMenu.id)}
          onDelete={() => {
            setConfirmDelete({ type: contextMenu.type, id: contextMenu.id });
            setContextMenu(null);
          }}
          onAddTask={
            contextMenu.type === 'directory'
              ? () => {
                  addTask(contextMenu.id, t(locale, 'task'));
                  toast.success(t(locale, 'toastAddSuccess'));
                  toggleDirectoryCollapse(contextMenu.id);
                  setContextMenu(null);
                }
              : undefined
          }
          onClose={closeContextMenu}
        />
      )}
    </>
  );
}

function DirectoryItem({
  dir,
  locale,
  isRenaming,
  renameValue,
  onToggle,
  onContextMenu,
  onRenameChange,
  onRenameCommit,
  onRenameCancel,
}: {
  dir: Directory;
  locale: 'zh' | 'en';
  isRenaming: boolean;
  renameValue: string;
  onToggle: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onRenameChange: (v: string) => void;
  onRenameCommit: () => void;
  onRenameCancel: () => void;
}) {
  return (
    <div
      className="flex items-center px-2 py-1 text-sm font-medium cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 group"
      onClick={onToggle}
      onContextMenu={onContextMenu}
    >
      <span className="mr-1 text-xs text-zinc-400">{dir.collapsed ? '▸' : '▾'}</span>
      {isRenaming ? (
        <input
          className="flex-1 bg-transparent outline-none border-b border-zinc-400 text-sm"
          value={renameValue}
          onChange={(e) => onRenameChange(e.target.value)}
          onBlur={onRenameCommit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onRenameCommit();
            if (e.key === 'Escape') onRenameCancel();
          }}
          autoFocus
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span className="truncate">{dir.name}</span>
      )}
    </div>
  );
}

function TaskItem({
  name,
  active,
  isRenaming,
  renameValue,
  onClick,
  onContextMenu,
  onRenameChange,
  onRenameCommit,
  onRenameCancel,
}: {
  name: string;
  active: boolean;
  isRenaming: boolean;
  renameValue: string;
  onClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onRenameChange: (v: string) => void;
  onRenameCommit: () => void;
  onRenameCancel: () => void;
}) {
  return (
    <div
      className={`flex items-center pl-6 pr-2 py-1 text-sm cursor-pointer ${
        active
          ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100'
          : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
      }`}
      onClick={onClick}
      onContextMenu={onContextMenu}
    >
      {isRenaming ? (
        <input
          className="flex-1 bg-transparent outline-none border-b border-zinc-400 text-sm"
          value={renameValue}
          onChange={(e) => onRenameChange(e.target.value)}
          onBlur={onRenameCommit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onRenameCommit();
            if (e.key === 'Escape') onRenameCancel();
          }}
          autoFocus
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span className="truncate">{name}</span>
      )}
    </div>
  );
}

function ContextMenu({
  x,
  y,
  locale,
  onRename,
  onDelete,
  onAddTask,
  onClose,
}: {
  x: number;
  y: number;
  locale: 'zh' | 'en';
  onRename: () => void;
  onDelete: () => void;
  onAddTask?: () => void;
  onClose: () => void;
}) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="fixed z-50 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded shadow-lg py-1 text-sm min-w-[120px]"
        style={{ left: x, top: y }}
      >
        {onAddTask && (
          <button
            className="w-full text-left px-3 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-700"
            onClick={onAddTask}
          >
            {t(locale, 'addTask')}
          </button>
        )}
        <button
          className="w-full text-left px-3 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-700"
          onClick={onRename}
        >
          {t(locale, 'rename')}
        </button>
        <button
          className="w-full text-left px-3 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-red-500"
          onClick={onDelete}
        >
          {t(locale, 'delete')}
        </button>
      </div>
    </>
  );
}
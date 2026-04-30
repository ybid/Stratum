'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useTaskStore } from '@/lib/store';
import { ToastContainer } from '@/components/ToastContainer';
import { CommandPalette } from '@/components/CommandPalette';
import { useCommandStore } from '@/lib/command-store';
import { useThemeStore } from '@/lib/theme-store';

const TaskBoard = dynamic(() => import('@/components/TaskBoard').then(m => ({ default: m.TaskBoard })), { ssr: false });
const KanbanView = dynamic(() => import('@/components/KanbanView').then(m => ({ default: m.KanbanView })), { ssr: false });
const CalendarView = dynamic(() => import('@/components/CalendarView').then(m => ({ default: m.CalendarView })), { ssr: false });
const GanttView = dynamic(() => import('@/components/GanttView').then(m => ({ default: m.GanttView })), { ssr: false });
const Toolbar = dynamic(() => import('@/components/Toolbar').then(m => ({ default: m.Toolbar })), { ssr: false });
const Sidebar = dynamic(() => import('@/components/Sidebar').then(m => ({ default: m.Sidebar })), { ssr: false });

export default function Home() {
  const init = useTaskStore((s) => s.init);
  const isLoading = useTaskStore((s) => s.isLoading);
  const viewMode = useTaskStore((s) => s.viewMode);
  const openCommandPalette = useCommandStore((s) => s.open);
  const setThemeMode = useThemeStore((s) => s.setMode);

  useEffect(() => {
    init();
    // Initialize theme on app load
    setThemeMode(useThemeStore.getState().mode);
  }, [init, setThemeMode]);

  // Global keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        openCommandPalette();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [openCommandPalette]);

  if (isLoading) {
    return (
      <div suppressHydrationWarning className="flex items-center justify-center h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
        <div className="text-center">
          <div className="text-lg mb-2">Loading...</div>
          <div className="text-sm text-zinc-500">Initializing database connection</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <ToastContainer />
      <CommandPalette />
      <div suppressHydrationWarning className="flex flex-col h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
        <Toolbar />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-auto">
            {viewMode === 'kanban' ? <KanbanView /> :
             viewMode === 'calendar' ? <CalendarView /> :
             viewMode === 'gantt' ? <GanttView /> :
             <TaskBoard />}
          </main>
        </div>
      </div>
    </>
  );
}
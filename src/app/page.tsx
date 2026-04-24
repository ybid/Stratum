'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useTaskStore } from '@/lib/store';
import { t } from '@/lib/i18n';

const TaskBoard = dynamic(() => import('@/components/TaskBoard').then(m => ({ default: m.TaskBoard })), { ssr: false });
const Toolbar = dynamic(() => import('@/components/Toolbar').then(m => ({ default: m.Toolbar })), { ssr: false });
const Sidebar = dynamic(() => import('@/components/Sidebar').then(m => ({ default: m.Sidebar })), { ssr: false });

export default function Home() {
  const init = useTaskStore((s) => s.init);
  const isLoading = useTaskStore((s) => s.isLoading);
  const locale = useTaskStore((s) => s.locale);

  useEffect(() => {
    init();
  }, [init]);

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
    <div suppressHydrationWarning className="flex flex-col h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <Toolbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <TaskBoard />
        </main>
      </div>
    </div>
  );
}
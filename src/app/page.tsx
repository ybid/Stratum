'use client';

import { useTaskStore } from '@/lib/store';
import { TaskBoard } from '@/components/TaskBoard';
import { Toolbar } from '@/components/Toolbar';
import { Sidebar } from '@/components/Sidebar';

export default function Home() {
  return (
    <div className="flex flex-col h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
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

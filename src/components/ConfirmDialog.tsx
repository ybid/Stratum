'use client';

import { useTaskStore } from '@/lib/store';
import type { Locale } from '@/lib/types';

interface Props {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  locale: Locale;
}

export function ConfirmDialog({ open, title, message, onConfirm, onCancel, locale }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onCancel} />
      <div className="relative bg-white dark:bg-zinc-900 rounded-lg shadow-xl p-6 w-80 max-w-[90vw]">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            {locale === 'zh' ? '取消' : 'Cancel'}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700"
          >
            {locale === 'zh' ? '删除' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

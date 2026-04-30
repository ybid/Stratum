'use client';

import { useState, useEffect, useRef } from 'react';
import { useTaskStore } from '@/lib/store';
import { useThemeStore } from '@/lib/theme-store';
import { t } from '@/lib/i18n';
import { toast } from '@/lib/toast-store';

export function ThemeSwitcher() {
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);
  const locale = useTaskStore((s) => s.locale);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const options = [
    { value: 'auto' as const, label: locale === 'zh' ? '自动' : 'Auto', icon: '🌓' },
    { value: 'light' as const, label: locale === 'zh' ? '浅色' : 'Light', icon: '☀️' },
    { value: 'dark' as const, label: locale === 'zh' ? '深色' : 'Dark', icon: '🌙' },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
      >
        {mode === 'dark' ? '🌙' : mode === 'light' ? '☀️' : '🌓'}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg py-1 min-w-[120px]">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { setMode(opt.value); setOpen(false); toast.success(opt.label); }}
              className={`w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 ${
                mode === opt.value
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  : 'text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700'
              }`}
            >
              <span>{opt.icon}</span>
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
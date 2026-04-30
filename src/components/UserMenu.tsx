'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { useTaskStore } from '@/lib/store';
import { t } from '@/lib/i18n';
import { AuthModal } from './AuthModal';

export function UserMenu() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const locale = useTaskStore((s) => s.locale);
  const [open, setOpen] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
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

  function handleLogout() {
    logout();
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-medium hover:bg-blue-600 transition-colors"
        title={user?.username || (locale === 'zh' ? '登录' : 'Login')}
      >
        {user ? user.username.charAt(0).toUpperCase() : '?'}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded shadow-lg py-1 min-w-[140px]">
          {user ? (
            <>
              <div className="px-3 py-1.5 text-sm text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-700">
                {user.username}
              </div>
              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700 text-red-500"
              >
                {locale === 'zh' ? '退出登录' : 'Logout'}
              </button>
            </>
          ) : (
            <button
              onClick={() => { setShowAuth(true); setOpen(false); }}
              className="w-full text-left px-3 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700"
            >
              {locale === 'zh' ? '登录 / 注册' : 'Login / Register'}
            </button>
          )}
        </div>
      )}

      {showAuth && <AuthModal locale={locale} onClose={() => setShowAuth(false)} />}
    </div>
  );
}

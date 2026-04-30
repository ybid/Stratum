'use client';

import { useState } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { t } from '@/lib/i18n';
import { toast } from '@/lib/toast-store';

interface AuthModalProps {
  locale: 'zh' | 'en';
  onClose: () => void;
}

export function AuthModal({ locale, onClose }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const setUser = useAuthStore((s) => s.setUser);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError(locale === 'zh' ? '请输入用户名和密码' : 'Please enter username and password');
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      setError(locale === 'zh' ? '两次密码不一致' : 'Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || (locale === 'zh' ? '操作失败' : 'Operation failed'));
        return;
      }

      setUser(data.user);
      toast.success(locale === 'zh' ? (isLogin ? '登录成功' : '注册成功') : (isLogin ? 'Login successful' : 'Registration successful'));
      onClose();
    } catch {
      setError(locale === 'zh' ? '网络错误' : 'Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white dark:bg-zinc-800 rounded-lg shadow-xl p-6 w-80">
        <h2 className="text-lg font-semibold mb-4">
          {isLogin
            ? (locale === 'zh' ? '登录' : 'Login')
            : (locale === 'zh' ? '注册' : 'Register')}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              {locale === 'zh' ? '用户名' : 'Username'}
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-700 outline-none focus:border-blue-500"
              placeholder={locale === 'zh' ? '请输入用户名' : 'Enter username'}
              minLength={3}
              maxLength={20}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              {locale === 'zh' ? '密码' : 'Password'}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-700 outline-none focus:border-blue-500"
              placeholder={locale === 'zh' ? '请输入密码' : 'Enter password'}
              minLength={6}
              maxLength={50}
            />
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm font-medium mb-1">
                {locale === 'zh' ? '确认密码' : 'Confirm Password'}
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-700 outline-none focus:border-blue-500"
                placeholder={locale === 'zh' ? '请再次输入密码' : 'Confirm password'}
                minLength={6}
                maxLength={50}
              />
            </div>
          )}

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white rounded font-medium disabled:opacity-50"
          >
            {loading
              ? (locale === 'zh' ? '请稍候...' : 'Please wait...')
              : (isLogin
                ? (locale === 'zh' ? '登录' : 'Login')
                : (locale === 'zh' ? '注册' : 'Register'))}
          </button>
        </form>

        <div className="mt-4 text-center text-sm">
          <button
            onClick={() => { setIsLogin(!isLogin); setError(''); setPassword(''); setConfirmPassword(''); }}
            className="text-blue-500 hover:underline"
          >
            {isLogin
              ? (locale === 'zh' ? '没有账号？去注册' : 'No account? Register')
              : (locale === 'zh' ? '已有账号？去登录' : 'Have an account? Login')}
          </button>
        </div>

        <button
          onClick={onClose}
          className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-zinc-600"
        >
          ×
        </button>
      </div>
    </>
  );
}

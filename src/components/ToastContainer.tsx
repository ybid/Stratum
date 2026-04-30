'use client';

import { useToastStore, type ToastType } from '@/lib/toast-store';

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          id={toast.id}
          type={toast.type}
          message={toast.message}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}

function ToastItem({
  id,
  type,
  message,
  onClose,
}: {
  id: string;
  type: ToastType;
  message: string;
  onClose: () => void;
}) {
  const bgClass = {
    success: 'bg-green-600 hover:bg-green-500',
    error: 'bg-red-600 hover:bg-red-500',
    info: 'bg-blue-600 hover:bg-blue-500',
  }[type];

  const icon = {
    success: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    error: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    info: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  }[type];

  return (
    <div
      className={`
        pointer-events-auto flex items-center gap-2 px-4 py-2.5 rounded-lg shadow-lg
        text-white text-sm font-medium min-w-[200px] max-w-[360px]
        animate-slide-in-right
        ${bgClass}
      `}
      role="alert"
    >
      <span className="shrink-0">{icon}</span>
      <span className="flex-1">{message}</span>
      <button
        onClick={onClose}
        className="shrink-0 p-0.5 rounded hover:bg-white/20 transition-colors"
        aria-label="Close"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
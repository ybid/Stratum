'use client';

import { Component, type ReactNode, type ErrorInfo } from 'react';
import { useTaskStore } from '@/lib/store';
import { t } from '@/lib/i18n';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return <ErrorFallback error={this.state.error} />;
    }

    return this.props.children;
  }
}

function ErrorFallback({ error }: { error: Error | null }) {
  const locale = useTaskStore((s) => s.locale);

  return (
    <div className="flex items-center justify-center h-full min-h-200">
      <div className="text-center p-8 max-w-md">
        <div className="text-4xl mb-4">⚠️</div>
        <h2 className="text-lg font-semibold mb-2">
          {locale === 'zh' ? '发生了一些错误' : 'Something went wrong'}
        </h2>
        <p className="text-sm text-zinc-500 mb-4">
          {locale === 'zh'
            ? '应用程序遇到了一个错误。请尝试刷新页面。'
            : 'The application encountered an error. Please try refreshing the page.'}
        </p>
        {error && (
          <details className="text-left bg-zinc-100 dark:bg-zinc-800 rounded p-2 text-xs mb-4">
            <summary className="cursor-pointer font-medium mb-1">
              {locale === 'zh' ? '错误详情' : 'Error details'}
            </summary>
            <pre className="overflow-auto max-h-32 whitespace-pre-wrap">
              {error.message}
            </pre>
          </details>
        )}
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          {locale === 'zh' ? '刷新页面' : 'Refresh Page'}
        </button>
      </div>
    </div>
  );
}
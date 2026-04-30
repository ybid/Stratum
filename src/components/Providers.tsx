'use client';

import { useTaskStore } from '@/lib/store';
import { ToastContainer } from '@/components/ToastContainer';
import { useEffect } from 'react';

function StoreInitializer() {
  const init = useTaskStore((s) => s.init);
  useEffect(() => {
    init();
  }, [init]);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StoreInitializer />
      <ToastContainer />
      {children}
    </>
  );
}
'use client';

import { useEffect, useState } from 'react';

interface ChatLayoutProps {
  children: React.ReactNode;
}

export function ChatLayout({ children }: ChatLayoutProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null; // or a loading skeleton
  }

  return (
    <div className="flex h-screen bg-white dark:bg-gray-900">
      <main className="flex-1 relative">
        {children}
      </main>
    </div>
  );
} 
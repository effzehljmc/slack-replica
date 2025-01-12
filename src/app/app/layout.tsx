'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/use-auth';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Basic hooks
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  // Effect hooks
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  // Early return for settings pages
  const isSettingsPage = pathname?.startsWith('/app/settings');
  if (isSettingsPage) {
    return children;
  }

  return (
    <div>
      {/* Add your chat UI components here */}
      {children}
    </div>
  );
} 
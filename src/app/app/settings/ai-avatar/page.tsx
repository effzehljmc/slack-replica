'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import AIAvatarSettings from '@/features/chat/components/AIAvatarSettings';
import { useEffect } from 'react';
import { useCurrentUser } from '@/features/auth/hooks/use-current-user';

export default function AIAvatarSettingsPage() {
  const { data: user } = useCurrentUser();

  useEffect(() => {
    // Any initialization logic here
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">AI Avatar Settings</h1>
      <AIAvatarSettings />
    </div>
  );
} 
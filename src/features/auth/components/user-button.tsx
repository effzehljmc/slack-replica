'use client';

import React from "react";
import { useCurrentUser } from "../hooks/use-current-user";
import { useAuth } from "../hooks/use-auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { UserStatusIndicator } from "@/features/chat/components/UserStatusIndicator";
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export function UserButton() {
  const { data: user, isLoading } = useCurrentUser();
  const { signOut } = useAuth();
  const updateStatus = useMutation(api.users.updateStatus);
  const router = useRouter();
  
  // Get real-time status updates
  const status = useQuery(
    api.users.getUserStatus,
    user?._id ? { userId: user._id } : "skip"
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-2">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const fallback = user.name ? user.name.charAt(0).toUpperCase() : "U";

  const toggleStatus = async () => {
    if (!user._id) return;
    const newStatus = status === 'away' ? 'online' : 'away';
    await updateStatus({ userId: user._id, status: newStatus });
  };

  const handleAIAvatarClick = () => {
    router.push('/app/settings/ai-avatar');
  };

  const trigger = (
    <button className="flex items-center gap-2 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition">
      <div className="relative">
        <Avatar className="h-8 w-8">
          <AvatarFallback>{fallback}</AvatarFallback>
        </Avatar>
        <UserStatusIndicator 
          status={status} 
          className="absolute bottom-0 right-0 h-2.5 w-2.5 ring-2 ring-white"
        />
      </div>
      <span className="text-sm font-medium">{user.name || user.email}</span>
    </button>
  );

  return (
    <DropdownMenu trigger={trigger}>
      <DropdownMenuItem onClick={toggleStatus}>
        {status === 'away' ? 'Set as Online' : 'Set as Away'}
      </DropdownMenuItem>
      <Link href="/app/settings/ai-avatar" className="block">
        <DropdownMenuItem onClick={handleAIAvatarClick}>
          AI Avatar Settings
        </DropdownMenuItem>
      </Link>
      <DropdownMenuItem onClick={signOut}>
        Log Out
      </DropdownMenuItem>
    </DropdownMenu>
  );
} 
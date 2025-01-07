'use client';

import React from "react";
import { useCurrentUser } from "../hooks/use-current-user";
import { useAuth } from "../hooks/use-auth";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuItem } from "@/components/ui/dropdown-menu";

export function UserButton() {
  const { data: user, isLoading } = useCurrentUser();
  const { signOut } = useAuth();

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

  const trigger = (
    <button className="flex items-center gap-2 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition">
      <Avatar className="h-8 w-8">
        <AvatarFallback>{fallback}</AvatarFallback>
      </Avatar>
      <span className="text-sm font-medium">{user.name || user.email}</span>
    </button>
  );

  return (
    <DropdownMenu trigger={trigger}>
      <DropdownMenuItem onClick={signOut}>
        Log Out
      </DropdownMenuItem>
    </DropdownMenu>
  );
} 
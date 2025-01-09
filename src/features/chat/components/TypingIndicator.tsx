'use client';

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";

interface TypingIndicatorProps {
  channelId?: Id<"channels">;
  receiverId?: Id<"users">;
  chatType: "channel" | "direct";
  currentUserId: Id<"users">;
  className?: string;
}

export function TypingIndicator({ channelId, receiverId, chatType, currentUserId, className }: TypingIndicatorProps) {
  const typingUsers = useQuery(api.typing.getTypingUsers, {
    channelId,
    receiverId,
    chatType,
    currentUserId,
  });

  if (!typingUsers?.length) return null;

  const names = typingUsers
    .filter((user): user is NonNullable<typeof user> => user !== null)
    .map(user => user.name || user.email.split('@')[0]);

  if (!names.length) return null;

  let message = '';
  if (names.length === 1) {
    message = `${names[0]} is typing...`;
  } else if (names.length === 2) {
    message = `${names[0]} and ${names[1]} are typing...`;
  } else if (names.length === 3) {
    message = `${names[0]}, ${names[1]}, and ${names[2]} are typing...`;
  } else {
    message = `${names.length} people are typing...`;
  }

  return (
    <div className={cn("text-sm text-gray-500 h-6", className)}>
      <div className="flex items-center gap-1">
        <span>{message}</span>
        <span className="flex gap-1">
          <span className="animate-bounce">.</span>
          <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>.</span>
          <span className="animate-bounce" style={{ animationDelay: '0.4s' }}>.</span>
        </span>
      </div>
    </div>
  );
} 
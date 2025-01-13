'use client';

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Message } from "../types";
import { MessageItem } from "./MessageItem";
import { Id } from "../../../../convex/_generated/dataModel";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";

interface ThreadMessageListProps {
  threadId: Id<"messages">;
}

export function ThreadMessageList({ threadId }: ThreadMessageListProps) {
  const messages = useQuery(api.messages.listThreadMessages, { threadId });
  const { data: user } = useCurrentUser();

  if (!messages || !user) return null;

  return (
    <div className="flex flex-col gap-2 p-4">
      {messages.map(msg => {
        if (!msg.author) return null;

        return (
          <MessageItem 
            key={msg._id} 
            message={msg as Message & {
              author: { name?: string; email: string; isAI?: boolean };
              createdAt: number;
            }} 
            isThreadReply 
            currentUserId={user._id}
          />
        );
      })}
      {messages.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          No replies yet. Start the conversation!
        </div>
      )}
    </div>
  );
} 
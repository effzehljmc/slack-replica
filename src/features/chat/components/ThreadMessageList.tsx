'use client';

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { ChannelMessage } from "../types";
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
        const message: ChannelMessage = {
          _id: msg._id,
          content: msg.content,
          authorId: msg.authorId,
          author: {
            name: msg.author?.name || '',
            email: msg.author?.email || '',
          },
          createdAt: msg.createdAt,
          channelId: msg.channelId,
          threadId: msg.threadId,
          hasThreadReplies: msg.hasThreadReplies,
          replyCount: msg.replyCount,
        };
        return (
          <MessageItem 
            key={msg._id} 
            message={message} 
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
'use client';

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Message } from "../types";
import { MessageItem } from "./MessageItem";
import { Id } from "../../../../convex/_generated/dataModel";

interface ThreadMessageListProps {
  threadId: Id<"messages">;
}

export function ThreadMessageList({ threadId }: ThreadMessageListProps) {
  const messages = useQuery(api.messages.listThreadMessages, { threadId });

  if (!messages) {
    return (
      <div className="flex-1 p-4">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-14 bg-gray-100 rounded-md" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 space-y-4">
      {messages.map((msg) => {
        const message: Message = {
          _id: msg._id,
          content: msg.content,
          authorId: msg.authorId,
          author: {
            name: msg.author?.name || '',
            email: msg.author?.email || '',
          },
          timestamp: msg.timestamp,
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
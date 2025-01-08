'use client';

import { Message } from "../types";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MessageItemProps {
  message: Message;
  isThreadReply?: boolean;
  onThreadClick?: (message: Message) => void;
  isDirectMessage?: boolean;
}

export function MessageItem({ message, isThreadReply, onThreadClick, isDirectMessage }: MessageItemProps) {
  const handleThreadClick = () => {
    if (!isThreadReply && !isDirectMessage && onThreadClick) {
      onThreadClick(message);
    }
  };

  const authorName = message.author?.name || message.author?.email || 'Unknown';

  const timestamp = message.timestamp || message.createdAt || Date.now();

  return (
    <div className={cn(
      "group flex items-start gap-3 py-2 px-3 hover:bg-gray-50 rounded-lg transition-colors",
      isThreadReply && "pl-6"
    )}>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{authorName}</span>
          <span className="text-sm text-gray-500">
            {new Date(timestamp).toLocaleTimeString()}
          </span>
        </div>
        <p className="mt-1">{message.content}</p>
      </div>
      
      {!isThreadReply && !isDirectMessage && (
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "flex items-center gap-1",
            message.hasThreadReplies ? "opacity-100" : "opacity-0 group-hover:opacity-100",
            "transition-opacity"
          )}
          onClick={handleThreadClick}
        >
          <MessageSquare className="h-4 w-4" />
          {message.hasThreadReplies && (
            <span className="text-xs">
              {message.replyCount} {message.replyCount === 1 ? 'reply' : 'replies'}
            </span>
          )}
        </Button>
      )}
    </div>
  );
} 
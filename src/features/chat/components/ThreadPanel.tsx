'use client';

import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { Message } from "../types";
import { ThreadMessageList } from "./ThreadMessageList";
import { ThreadMessageInput } from "./ThreadMessageInput";
import { cn } from "@/lib/utils";

interface ThreadPanelProps {
  isOpen: boolean;
  originalMessage: Message | null;
  onClose: () => void;
}

export function ThreadPanel({ isOpen, originalMessage, onClose }: ThreadPanelProps) {
  if (!originalMessage) return null;

  const timestamp = originalMessage.timestamp || originalMessage.createdAt || Date.now();

  return (
    <div
      className={cn(
        "fixed right-0 top-0 h-screen w-[400px] bg-white border-l border-gray-200 shadow-lg",
        "transform transition-transform duration-300 ease-in-out z-50",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-lg font-semibold">Thread</h2>
            <p className="text-sm text-gray-500">
              {originalMessage.hasThreadReplies 
                ? `${originalMessage.replyCount} ${originalMessage.replyCount === 1 ? 'reply' : 'replies'}`
                : 'No replies yet'}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {originalMessage.author?.name || originalMessage.author?.email || 'Unknown'}
                </span>
                <span className="text-sm text-gray-500">
                  {new Date(timestamp).toLocaleTimeString()}
                </span>
              </div>
              <p className="mt-1">{originalMessage.content}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <ThreadMessageList threadId={originalMessage._id} />
        </div>

        <div className="p-4 border-t">
          <ThreadMessageInput threadId={originalMessage._id} />
        </div>
      </div>
    </div>
  );
} 
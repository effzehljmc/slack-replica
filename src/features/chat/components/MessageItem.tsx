'use client';

import { Message, isDirectMessage, isChannelMessage } from "../types";
import { MessageSquare, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MessageReactions } from "./MessageReactions";
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Id } from "../../../../convex/_generated/dataModel";
import { MessageAttachment } from "./MessageAttachment";

interface MessageItemProps {
  message: Message;
  isThreadReply?: boolean;
  onThreadClick?: (message: Message) => void;
  currentUserId: Id<"users">;
}

export function MessageItem({ message, isThreadReply, onThreadClick, currentUserId }: MessageItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content);
  
  const editChannelMessage = useMutation(api.messages.editMessage);
  const deleteChannelMessage = useMutation(api.messages.deleteMessage);
  const editDirectMessage = useMutation(api.direct_messages.editDirectMessage);
  const deleteDirectMessage = useMutation(api.direct_messages.deleteDirectMessage);

  const handleThreadClick = () => {
    if (!isThreadReply && isChannelMessage(message) && onThreadClick) {
      onThreadClick(message);
    }
  };

  const handleEdit = async () => {
    if (!isEditing) {
      setIsEditing(true);
      return;
    }

    if (isChannelMessage(message)) {
      await editChannelMessage({
        messageId: message._id,
        content: editedContent,
        authorId: currentUserId,
      });
    } else if (isDirectMessage(message)) {
      await editDirectMessage({
        messageId: message._id,
        content: editedContent,
        userId: currentUserId,
      });
    }
    setIsEditing(false);
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      if (isChannelMessage(message)) {
        await deleteChannelMessage({
          messageId: message._id,
          authorId: currentUserId,
        });
      } else if (isDirectMessage(message)) {
        await deleteDirectMessage({
          messageId: message._id,
          userId: currentUserId,
        });
      }
    } catch (error) {
      console.error('Failed to delete message:', error);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleEdit();
    }
    if (e.key === "Escape") {
      setIsEditing(false);
      setEditedContent(message.content);
    }
  };

  const authorName = message.author?.name || message.author?.email || 'Unknown';
  const timestamp = message.timestamp || message.createdAt || Date.now();
  const messageType = isDirectMessage(message) ? "direct_message" : "message";
  const canShowThreadButton = !isThreadReply && isChannelMessage(message);
  const isAuthor = isChannelMessage(message) 
    ? message.authorId === currentUserId 
    : message.senderId === currentUserId;

  return (
    <div 
      id={`message-${message._id}`}
      className={cn(
        "group px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800/50",
        "transition-colors duration-200"
      )}
    >
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{authorName}</span>
          <span className="text-sm text-gray-500">
            {new Date(timestamp).toLocaleTimeString()}
          </span>
          {message.isEdited && (
            <span className="text-xs text-gray-400">(edited)</span>
          )}
          {isAuthor && (
            <div className="relative ml-auto">
              <DropdownMenu
                trigger={
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-8 w-8 p-0",
                      "opacity-0 group-hover:opacity-100",
                      "focus:opacity-100",
                      "transition-opacity duration-200"
                    )}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                }
              >
                <DropdownMenuItem onClick={handleEdit}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                {showDeleteConfirm ? (
                  <DropdownMenuItem 
                    onClick={handleDelete}
                    className={cn(
                      "text-red-600 font-medium",
                      isDeleting && "opacity-50 pointer-events-none"
                    )}
                  >
                    {isDeleting ? (
                      <>
                        <span className="h-4 w-4 mr-2 animate-spin">⏳</span>
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Confirm Delete
                      </>
                    )}
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem 
                    onClick={() => setShowDeleteConfirm(true)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenu>
            </div>
          )}
        </div>
        {isEditing ? (
          <div className="mt-1">
            <Textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              onKeyDown={handleKeyDown}
              className="min-h-[60px]"
              autoFocus
            />
            <div className="mt-2 flex gap-2">
              <Button size="sm" onClick={handleEdit}>Save</Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setIsEditing(false);
                  setEditedContent(message.content);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-1 space-y-2">
            <p>{message.content}</p>
            {message.attachment && (
              <div className="mt-2">
                <MessageAttachment 
                  fileName={message.attachment.fileName}
                  fileType={message.attachment.fileType}
                  storageId={message.attachment.storageId}
                  fileSize={message.attachment.fileSize}
                />
              </div>
            )}
          </div>
        )}
        <MessageReactions 
          targetId={message._id} 
          targetType={messageType}
        />
      </div>
      
      {canShowThreadButton && (
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
'use client';

import { Message, isDirectMessage, isChannelMessage } from "../types";
import { MessageSquare, MoreVertical, Pencil, Trash2, Bot, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MessageReactions } from "./MessageReactions";
import { useState, useEffect, useRef } from "react";
import { useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Id } from "../../../../convex/_generated/dataModel";
import { MessageAttachment } from "./MessageAttachment";

interface MessageItemProps {
  message: Message & {
    author: {
      name?: string;
      email: string;
    };
    createdAt: number;
    threadCount?: number;
    attachment?: {
      fileName: string;
      fileType: string;
      storageId: string;
      fileSize: number;
    };
    isAvatarMessage?: boolean;
    ttsAudioId?: string;
  };
  isThreadReply?: boolean;
  onThreadClick?: (message: Message) => void;
  currentUserId: Id<"users">;
  isGrouped?: boolean;
}

export function MessageItem({ 
  message, 
  isThreadReply, 
  onThreadClick, 
  currentUserId,
  isGrouped = false 
}: MessageItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const editChannelMessage = useMutation(api.messages.editMessage);
  const deleteChannelMessage = useMutation(api.messages.deleteMessage);
  const editDirectMessage = useMutation(api.direct_messages.editDirectMessage);
  const deleteDirectMessage = useMutation(api.direct_messages.deleteDirectMessage);
  const synthesizeSpeech = useAction(api.audio.synthesizeSpeech);

  useEffect(() => {
    return () => {
      // Cleanup: stop any playing audio when component unmounts
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const handleBrowserTTS = () => {
    if (!window.speechSynthesis) {
      console.error('Speech synthesis not supported in this browser');
      return;
    }

    const utterance = new SpeechSynthesisUtterance(message.content);
    
    // Try to find an English voice
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(voice => 
      voice.lang.startsWith('en-') && !voice.localService
    ) || voices.find(voice => 
      voice.lang.startsWith('en-')
    ) || voices[0];

    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    window.speechSynthesis.cancel(); // Cancel any ongoing speech
    window.speechSynthesis.speak(utterance);
  };

  const handleVoiceToggle = async () => {
    try {
      // If already playing, stop the current audio
      if (isPlaying && audioRef.current) {
        console.log('[Debug - MessageItem] Stopping current playback');
        audioRef.current.pause();
        setIsPlaying(false);
        return;
      }

      // Stop any other playing audio elements
      document.querySelectorAll('audio').forEach(audio => audio.pause());

      console.log('[Debug - MessageItem] Starting voice synthesis with:', {
        messageId: message._id,
        authorId: message.authorId,
        isAvatarMessage: message.isAvatarMessage,
        content: message.content.substring(0, 100) + '...',
        currentUserId,
        isPlaying,
        hasExistingAudio: !!message.ttsAudioId,
        author: message.author,
        editedAt: message.editedAt
      });

      let storageId = message.ttsAudioId;

      // Generate new audio if none exists, if message was edited, or if voice settings changed
      if (!storageId || message.editedAt || message.isAvatarMessage) {
        console.log('[Debug - MessageItem] Generating new audio because:', {
          noExistingAudio: !storageId,
          wasEdited: !!message.editedAt,
          isAvatarMessage: message.isAvatarMessage
        });

        const result = await synthesizeSpeech({
          text: message.content,
          userId: message.authorId,
          messageId: message._id,
        });

        console.log('[Debug - MessageItem] Synthesis result:', result);

        if (!result?.success) {
          const errorMessage = result?.error || 'Unknown error';
          console.log('[Debug - MessageItem] Synthesis failed:', errorMessage);
          
          if (errorMessage.includes('credits depleted') || errorMessage.includes('API key invalid')) {
            console.error('[Debug - MessageItem] Fish Audio service unavailable:', errorMessage);
          }
          
          console.log('[Debug - MessageItem] Falling back to browser TTS');
          handleBrowserTTS();
          return;
        }

        storageId = result.storageId;
        
        // Wait a moment for the audio to be processed
        console.log('[Debug - MessageItem] Waiting for audio processing...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        console.log('[Debug - MessageItem] Using existing audio:', storageId);
      }

      // Reset audio ref
      if (audioRef.current) {
        console.log('[Debug - MessageItem] Cleaning up previous audio instance');
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current.load();
        audioRef.current = null;
      }

      console.log('[Debug - MessageItem] Fetching audio URL for storageId:', storageId);
      const url = await fetch(`/api/storage/${storageId}`).then(res => res.url);
      if (!url) {
        console.error('[Debug - MessageItem] Failed to get audio URL');
        throw new Error('Failed to get audio URL');
      }
      
      console.log('[Debug - MessageItem] Creating new Audio instance with URL:', url);
      const audio = new Audio();
      audio.preload = 'auto'; // Ensure audio is fully loaded before playing
      audioRef.current = audio;

      // Set up event handlers before setting src
      audio.onloadeddata = () => {
        console.log('[Debug - MessageItem] Audio loaded:', {
          duration: audio.duration,
          readyState: audio.readyState,
          paused: audio.paused,
          error: audio.error
        });
      };
      
      audio.onended = () => {
        console.log('[Debug - MessageItem] Audio playback ended');
        setIsPlaying(false);
        // Clean up audio instance after playback
        if (audioRef.current) {
          audioRef.current.src = '';
          audioRef.current.load();
          audioRef.current = null;
        }
      };

      audio.onpause = () => {
        console.log('[Debug - MessageItem] Audio playback paused');
        setIsPlaying(false);
      };

      audio.onplay = () => {
        console.log('[Debug - MessageItem] Audio playback started');
        setIsPlaying(true);
      };

      audio.onerror = (e) => {
        console.error('[Debug - MessageItem] Audio playback error:', e);
        setIsPlaying(false);
        handleBrowserTTS();
      };

      // Set source and start loading
      audio.src = url;
      audio.load();

      console.log('[Debug - MessageItem] Starting audio playback');
      // Wait for audio to be loaded before playing
      if (audio.readyState < 3) { // HAVE_FUTURE_DATA instead of HAVE_CURRENT_DATA
        console.log('[Debug - MessageItem] Waiting for audio to load...');
        await new Promise((resolve, reject) => {
          audio.oncanplaythrough = resolve; // Use oncanplaythrough instead of oncanplay
          audio.onerror = reject;
        });
      }

      await audio.play();
    } catch (error) {
      console.error('[Debug - MessageItem] Failed to play audio:', error instanceof Error ? error.message : error);
      setIsPlaying(false);
      console.log('[Debug - MessageItem] Falling back to browser TTS');
      handleBrowserTTS();
    }
  };

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

  return (
    <div 
      id={`message-${message._id}`}
      className={cn(
        "group relative flex gap-4 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800/50",
        isGrouped && "py-0.5",
        message.isAvatarMessage && "bg-primary/5 border-l-2 border-primary"
      )}
    >
      {/* Avatar - only show if not grouped */}
      {!isGrouped && (
        <div className="flex-shrink-0 w-10 h-10 relative">
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center",
            message.isAvatarMessage ? "bg-primary/10" : "bg-gray-200 dark:bg-gray-700"
          )}>
            <span className={cn(
              "text-lg font-semibold",
              message.isAvatarMessage ? "text-primary" : "text-gray-600 dark:text-gray-300"
            )}>
              {message.author.name?.[0]?.toUpperCase() || message.author.email[0]?.toUpperCase()}
            </span>
          </div>
          {message.isAvatarMessage && (
            <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full p-0.5">
              <Bot className="w-3 h-3" />
            </div>
          )}
        </div>
      )}

      {/* Message content */}
      <div className={cn(
        "flex-1 space-y-1",
        isGrouped && "ml-14" // Add left margin when grouped to align with the first message
      )}>
        {/* Author and timestamp - only show if not grouped */}
        {!isGrouped && (
          <div className="flex items-center gap-2">
            <span className={cn(
              "font-semibold",
              message.isAvatarMessage && "text-primary"
            )}>
              {message.author.name || message.author.email}
            </span>
            <span className="text-xs text-gray-500">
              {new Date(message.createdAt).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </span>
          </div>
        )}

        {/* Message content */}
        <div className="space-y-2">
          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                onKeyDown={handleKeyDown}
                className="min-h-[100px]"
              />
              <div className="flex gap-2">
                <Button 
                  onClick={() => handleEdit()}
                  disabled={editedContent.trim() === message.content}
                >
                  Save
                </Button>
                <Button 
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
            <div className="space-y-2">
              <p className="text-sm text-gray-900 dark:text-gray-100">{message.content}</p>
              {message.attachment && (
                <MessageAttachment 
                  fileName={message.attachment.fileName}
                  fileType={message.attachment.fileType}
                  storageId={message.attachment.storageId}
                  fileSize={message.attachment.fileSize}
                />
              )}
            </div>
          )}
        </div>

        {/* Message actions */}
        <div className={cn(
          "flex items-center gap-2",
          isGrouped && "mt-1" // Add top margin when grouped
        )}>
          {/* Thread button - only for channel messages */}
          {!isThreadReply && isChannelMessage(message) && (
            <Button
              variant="ghost"
              size="sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleThreadClick}
            >
              <MessageSquare className="h-4 w-4 mr-1" />
              {message.threadCount || 0}
            </Button>
          )}

          {/* Voice toggle - only for AI avatar messages */}
          {message.isAvatarMessage && (
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "transition-opacity",
                isPlaying ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              )}
              onClick={handleVoiceToggle}
            >
              {isPlaying ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
          )}

          {/* Reactions */}
          <MessageReactions
            targetId={message._id}
            targetType={isChannelMessage(message) ? "message" : "direct_message"}
          />

          {/* Edit/Delete dropdown - only for user's own messages */}
          {message.authorId === currentUserId && (
            <DropdownMenu
              trigger={
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              }
            >
              <DropdownMenuItem onClick={() => setIsEditing(true)}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => !isDeleting && setShowDeleteConfirm(true)}
                className={cn(
                  "text-red-500 hover:text-red-600",
                  isDeleting && "opacity-50 cursor-not-allowed"
                )}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {isDeleting ? 'Deleting...' : 'Delete'}
              </DropdownMenuItem>
            </DropdownMenu>
          )}

          {/* Delete confirmation dialog */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
              <div className="bg-background p-6 rounded-lg shadow-lg max-w-md w-full mx-4 relative z-[101]">
                <h3 className="text-lg font-semibold mb-4">Delete Message</h3>
                <p className="text-muted-foreground mb-6">Are you sure you want to delete this message? This action cannot be undone.</p>
                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isDeleting}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
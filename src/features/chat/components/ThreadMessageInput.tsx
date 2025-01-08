'use client';

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { Id } from "../../../../convex/_generated/dataModel";

interface ThreadMessageInputProps {
  threadId: Id<"messages">;
}

export function ThreadMessageInput({ threadId }: ThreadMessageInputProps) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const sendMessage = useMutation(api.messages.sendThreadMessage);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!content.trim() || !user?._id) return;

    setIsLoading(true);
    try {
      await sendMessage({
        content: content.trim(),
        threadId,
        authorId: user._id,
      });
      setContent("");
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Textarea
        value={content}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
        placeholder="Reply in thread..."
        disabled={isLoading}
        className="min-h-[100px]"
      />
      <Button 
        type="submit" 
        disabled={!content.trim() || isLoading}
        className="w-full"
      >
        {isLoading ? "Sending..." : "Reply"}
      </Button>
    </form>
  );
} 
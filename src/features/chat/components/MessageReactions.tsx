'use client';

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { SmilePlus } from "lucide-react";
import { cn } from "@/lib/utils";

const AVAILABLE_REACTIONS = [
  { code: 'thumbs_up', emoji: '👍' },
  { code: 'heart', emoji: '❤️' },
  { code: 'joy', emoji: '😂' },
  { code: 'wow', emoji: '😮' },
  { code: 'sad', emoji: '😢' },
  { code: 'party', emoji: '🎉' },
];

interface MessageReactionsProps {
  targetId: Id<"messages"> | Id<"direct_messages">;
  targetType: "message" | "direct_message";
}

interface ReactionData {
  count: number;
  users: string[];
  hasReacted: boolean;
  emoji: string;
}

export function MessageReactions({ targetId, targetType }: MessageReactionsProps) {
  const { user } = useAuth();
  const reactions = useQuery(api.reactions.getMessageReactions, { targetId, targetType }) as Record<string, ReactionData> | undefined;
  const addReaction = useMutation(api.reactions.addReaction);
  const removeReaction = useMutation(api.reactions.removeReaction);
  const [showReactionPicker, setShowReactionPicker] = useState(false);

  if (!user?._id) return null;

  const handleReactionClick = async (code: string) => {
    const hasReacted = reactions?.[code]?.users.includes(user._id);
    
    if (hasReacted) {
      await removeReaction({
        targetId,
        targetType,
        userId: user._id,
        emoji: code,
      });
    } else {
      await addReaction({
        targetId,
        targetType,
        userId: user._id,
        emoji: code,
      });
    }
    setShowReactionPicker(false);
  };

  return (
    <div className="flex items-center gap-1 mt-1">
      {reactions && Object.entries(reactions).map(([code, data]) => (
        <Button
          key={code}
          variant="ghost"
          size="sm"
          className={cn(
            "h-6 px-2 py-1 hover:bg-gray-100",
            data.users.includes(user._id) && "bg-gray-100"
          )}
          onClick={() => handleReactionClick(code)}
        >
          <span className="mr-1">{data.emoji}</span>
          <span className="text-xs">{data.count}</span>
        </Button>
      ))}
      
      <div className="relative">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={() => setShowReactionPicker(!showReactionPicker)}
        >
          <SmilePlus className="h-4 w-4" />
        </Button>

        {showReactionPicker && (
          <div className="absolute bottom-full left-0 mb-1 p-2 bg-white rounded-lg shadow-lg border flex gap-1">
            {AVAILABLE_REACTIONS.map(({ code, emoji }) => (
              <button
                key={code}
                className="hover:bg-gray-100 p-1 rounded"
                onClick={() => handleReactionClick(code)}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 
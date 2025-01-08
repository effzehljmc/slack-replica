import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

const EMOJI_MAP = {
  thumbs_up: '👍',
  heart: '❤️',
  joy: '😂',
  wow: '😮',
  sad: '😢',
  party: '🎉',
};

// Add a reaction to a message or direct message
export const addReaction = mutation({
  args: {
    targetId: v.union(v.id("messages"), v.id("direct_messages")),
    targetType: v.union(v.literal("message"), v.literal("direct_message")),
    userId: v.id("users"),
    emoji: v.string(), // This is the emoji code (e.g., 'thumbs_up')
  },
  handler: async (ctx, { targetId, targetType, userId, emoji }) => {
    // Check if the reaction already exists
    const existingReaction = await ctx.db
      .query("reactions")
      .filter((q) => 
        q.or(
          // Check new format
          q.and(
            q.eq(q.field("targetId"), targetId),
            q.eq(q.field("targetType"), targetType),
            q.eq(q.field("userId"), userId),
            q.eq(q.field("emoji"), emoji)
          ),
          // Check old format (only for messages)
          targetType === "message" && q.and(
            q.eq(q.field("messageId"), targetId),
            q.eq(q.field("userId"), userId),
            q.eq(q.field("emoji"), emoji)
          )
        )
      )
      .first();

    if (existingReaction) {
      return existingReaction._id;
    }

    // Add new reaction in new format
    return await ctx.db.insert("reactions", {
      targetId,
      targetType,
      userId,
      emoji,
      createdAt: Date.now(),
    });
  },
});

// Remove a reaction from a message or direct message
export const removeReaction = mutation({
  args: {
    targetId: v.union(v.id("messages"), v.id("direct_messages")),
    targetType: v.union(v.literal("message"), v.literal("direct_message")),
    userId: v.id("users"),
    emoji: v.string(),
  },
  handler: async (ctx, { targetId, targetType, userId, emoji }) => {
    const reaction = await ctx.db
      .query("reactions")
      .filter((q) => 
        q.or(
          // Check new format
          q.and(
            q.eq(q.field("targetId"), targetId),
            q.eq(q.field("targetType"), targetType),
            q.eq(q.field("userId"), userId),
            q.eq(q.field("emoji"), emoji)
          ),
          // Check old format (only for messages)
          targetType === "message" && q.and(
            q.eq(q.field("messageId"), targetId),
            q.eq(q.field("userId"), userId),
            q.eq(q.field("emoji"), emoji)
          )
        )
      )
      .first();

    if (reaction) {
      await ctx.db.delete(reaction._id);
    }
  },
});

// Get reactions for a message or direct message
export const getMessageReactions = query({
  args: {
    targetId: v.union(v.id("messages"), v.id("direct_messages")),
    targetType: v.union(v.literal("message"), v.literal("direct_message")),
  },
  handler: async (ctx, { targetId, targetType }) => {
    const reactions = await ctx.db
      .query("reactions")
      .filter((q) => 
        q.or(
          // Get reactions in new format
          q.and(
            q.eq(q.field("targetId"), targetId),
            q.eq(q.field("targetType"), targetType)
          ),
          // Get reactions in old format (only for messages)
          targetType === "message" && q.eq(q.field("messageId"), targetId)
        )
      )
      .collect();

    // Group reactions by emoji code
    const groupedReactions = reactions.reduce((acc, reaction) => {
      const emojiCode = reaction.emoji;
      if (!acc[emojiCode]) {
        acc[emojiCode] = {
          count: 0,
          users: [],
          hasReacted: false,
          emoji: EMOJI_MAP[emojiCode as keyof typeof EMOJI_MAP] || '❓', // Fallback emoji if code not found
        };
      }
      acc[emojiCode].count++;
      acc[emojiCode].users.push(reaction.userId);
      return acc;
    }, {} as Record<string, { count: number; users: string[]; hasReacted: boolean; emoji: string }>);

    return groupedReactions;
  },
}); 
import { mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

interface OldReaction {
  _id: Id<"reactions">;
  messageId: Id<"messages">;
  userId: Id<"users">;
  emoji: string;
  createdAt: number;
}

// Migrate existing reactions to the new schema
export const migrateReactions = mutation({
  args: {},
  handler: async (ctx) => {
    // Get all reactions
    const reactions = await ctx.db
      .query("reactions")
      .collect();

    // Update each reaction
    for (const reaction of reactions) {
      const oldReaction = reaction as unknown as OldReaction;
      if ('messageId' in oldReaction && !('targetId' in oldReaction)) {
        // Delete the old reaction
        await ctx.db.delete(oldReaction._id);

        // Create a new reaction with the updated schema
        await ctx.db.insert("reactions", {
          targetId: oldReaction.messageId,
          targetType: "message",
          userId: oldReaction.userId,
          emoji: oldReaction.emoji,
          createdAt: oldReaction.createdAt,
        });
      }
    }
  },
});

// Migrate AI messages to use isAvatarMessage flag
export const migrateAIMessages = mutation({
  args: {},
  handler: async (ctx) => {
    // Get all AI users
    const aiUsers = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("autoAvatarEnabled"), true))
      .collect();

    const aiUserIds = new Set(aiUsers.map(user => user._id));

    // Update channel messages
    const channelMessages = await ctx.db
      .query("messages")
      .filter((q) => q.eq(q.field("isAvatarMessage"), undefined))
      .collect();

    for (const message of channelMessages) {
      if (aiUserIds.has(message.authorId)) {
        await ctx.db.patch(message._id, {
          isAvatarMessage: true
        });
      }
    }

    // Update direct messages
    const directMessages = await ctx.db
      .query("direct_messages")
      .filter((q) => q.eq(q.field("isAvatarMessage"), undefined))
      .collect();

    for (const message of directMessages) {
      if (aiUserIds.has(message.senderId)) {
        await ctx.db.patch(message._id, {
          isAvatarMessage: true
        });
      }
    }
  },
}); 
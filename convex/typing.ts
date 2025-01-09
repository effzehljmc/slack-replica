import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Update typing status for a user
export const updateTypingStatus = mutation({
  args: {
    userId: v.id("users"),
    channelId: v.optional(v.id("channels")),
    receiverId: v.optional(v.id("users")),
    chatType: v.union(v.literal("channel"), v.literal("direct")),
  },
  handler: async (ctx, args) => {
    const { userId, channelId, receiverId, chatType } = args;
    const now = Date.now();

    // Get existing typing indicator
    const existing = await ctx.db
      .query("typing_indicators")
      .filter((q) => {
        if (chatType === "channel") {
          return q.and(
            q.eq(q.field("userId"), userId),
            q.eq(q.field("channelId"), channelId),
            q.eq(q.field("chatType"), "channel")
          );
        } else {
          return q.and(
            q.eq(q.field("userId"), userId),
            q.eq(q.field("receiverId"), receiverId),
            q.eq(q.field("chatType"), "direct")
          );
        }
      })
      .first();

    if (existing) {
      // Update lastTypedAt
      await ctx.db.patch(existing._id, { lastTypedAt: now });
    } else {
      // Create new typing indicator
      await ctx.db.insert("typing_indicators", {
        userId,
        channelId: chatType === "channel" ? channelId : undefined,
        receiverId: chatType === "direct" ? receiverId : undefined,
        chatType,
        lastTypedAt: now,
      });
    }
  },
});

// Remove typing status for a user
export const removeTypingStatus = mutation({
  args: {
    userId: v.id("users"),
    channelId: v.optional(v.id("channels")),
    receiverId: v.optional(v.id("users")),
    chatType: v.union(v.literal("channel"), v.literal("direct")),
  },
  handler: async (ctx, args) => {
    const { userId, channelId, receiverId, chatType } = args;

    const existing = await ctx.db
      .query("typing_indicators")
      .filter((q) => {
        if (chatType === "channel") {
          return q.and(
            q.eq(q.field("userId"), userId),
            q.eq(q.field("channelId"), channelId),
            q.eq(q.field("chatType"), "channel")
          );
        } else {
          return q.and(
            q.eq(q.field("userId"), userId),
            q.eq(q.field("receiverId"), receiverId),
            q.eq(q.field("chatType"), "direct")
          );
        }
      })
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});

// Get users who are typing
export const getTypingUsers = query({
  args: {
    channelId: v.optional(v.id("channels")),
    receiverId: v.optional(v.id("users")),
    chatType: v.union(v.literal("channel"), v.literal("direct")),
    currentUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const { channelId, receiverId, chatType, currentUserId } = args;
    const now = Date.now();
    const TYPING_TIMEOUT = 3000; // 3 seconds

    // Get typing indicators less than 3 seconds old
    const typingIndicators = await ctx.db
      .query("typing_indicators")
      .filter((q) => {
        const baseCondition = q.and(
          q.neq(q.field("userId"), currentUserId),
          q.gt(q.field("lastTypedAt"), now - TYPING_TIMEOUT)
        );

        if (chatType === "channel") {
          return q.and(
            baseCondition,
            q.eq(q.field("channelId"), channelId),
            q.eq(q.field("chatType"), "channel")
          );
        } else {
          // For direct messages, we need to check both sender and receiver
          return q.and(
            baseCondition,
            q.eq(q.field("chatType"), "direct"),
            q.or(
              // Show typing indicator if:
              // 1. Current user is the receiver and the other user is typing to them
              q.and(
                q.eq(q.field("receiverId"), currentUserId),
                q.eq(q.field("userId"), receiverId)
              ),
              // 2. Current user is the sender and the other user is typing back to them
              q.and(
                q.eq(q.field("receiverId"), receiverId),
                q.eq(q.field("userId"), currentUserId)
              )
            )
          );
        }
      })
      .collect();

    // Get user details for typing users
    const typingUsers = await Promise.all(
      typingIndicators.map(async (indicator) => {
        const user = await ctx.db.get(indicator.userId);
        return user ? {
          _id: user._id,
          name: user.name,
          email: user.email,
        } : null;
      })
    );

    return typingUsers.filter(Boolean);
  },
}); 
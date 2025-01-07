import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Send a direct message
export const sendDirectMessage = mutation({
  args: {
    content: v.string(),
    senderId: v.id("users"),
    receiverId: v.id("users"),
  },
  handler: async (ctx, { content, senderId, receiverId }) => {
    const messageId = await ctx.db.insert("direct_messages", {
      content,
      senderId,
      receiverId,
      createdAt: Date.now(),
    });
    return messageId;
  },
});

// Get direct messages between two users
export const getDirectMessages = query({
  args: {
    userId1: v.id("users"),
    userId2: v.id("users"),
  },
  handler: async (ctx, { userId1, userId2 }) => {
    // Get messages in both directions
    const sentMessages = await ctx.db
      .query("direct_messages")
      .withIndex("by_participants", (q) => 
        q.eq("senderId", userId1).eq("receiverId", userId2)
      )
      .collect();

    const receivedMessages = await ctx.db
      .query("direct_messages")
      .withIndex("by_participants_reverse", (q) => 
        q.eq("receiverId", userId1).eq("senderId", userId2)
      )
      .collect();

    // Combine and sort messages
    const allMessages = [...sentMessages, ...receivedMessages]
      .sort((a, b) => a.createdAt - b.createdAt);

    // Get user details for both participants
    const [user1, user2] = await Promise.all([
      ctx.db.get(userId1),
      ctx.db.get(userId2),
    ]);

    // Create a map of user IDs to user data
    const userMap = new Map([
      [userId1.toString(), user1],
      [userId2.toString(), user2],
    ]);

    // Add user data to messages
    return allMessages.map(message => ({
      ...message,
      sender: userMap.get(message.senderId.toString()),
    }));
  },
}); 
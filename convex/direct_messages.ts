import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

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

    // Combine and sort messages chronologically (oldest first)
    const allMessages = [...sentMessages, ...receivedMessages]
      .sort((a, b) => a.createdAt - b.createdAt);

    // Get user details for both participants
    const [user1, user2] = await Promise.all([
      ctx.db.get(userId1),
      ctx.db.get(userId2),
    ]);

    // Create a map of user IDs to user data
    const userMap = new Map([
      [userId1, user1],
      [userId2, user2],
    ]);

    // Add user data to messages
    return allMessages.map(message => ({
      ...message,
      author: userMap.get(message.senderId) || { name: 'Deleted User', email: '' },
    }));
  },
});

export const editDirectMessage = mutation({
  args: {
    messageId: v.id("direct_messages"),
    content: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, { messageId, content, userId }) => {
    const message = await ctx.db.get(messageId);
    if (!message) throw new Error("Message not found");
    
    // Verify the user is editing their own message
    if (message.senderId !== userId) {
      throw new Error("Unauthorized: Can only edit your own messages");
    }

    await ctx.db.patch(messageId, {
      content,
      isEdited: true,
      editedAt: Date.now(),
    });

    return messageId;
  },
});

export const deleteDirectMessage = mutation({
  args: {
    messageId: v.id("direct_messages"),
    userId: v.id("users"),
  },
  handler: async (ctx, { messageId, userId }) => {
    const message = await ctx.db.get(messageId);
    if (!message) throw new Error("Message not found");
    
    // Verify the user is deleting their own message
    if (message.senderId !== userId) {
      throw new Error("Unauthorized: Can only delete your own messages");
    }

    await ctx.db.delete(messageId);
    return messageId;
  },
}); 
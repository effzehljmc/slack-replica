import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

// Send a direct message
export const sendDirectMessage = mutation({
  args: {
    content: v.string(),
    senderId: v.id("users"),
    receiverId: v.id("users"),
    attachmentId: v.optional(v.id("attachments")),
  },
  handler: async (ctx, { content, senderId, receiverId, attachmentId }) => {
    try {
      // Check if message mentions an avatar
      const hasAvatarMention = content.match(/@[a-zA-Z0-9]+\'s\s*avatar/i) !== null;

      const messageId = await ctx.db.insert("direct_messages", {
        content,
        senderId,
        receiverId,
        attachmentId,
        createdAt: Date.now(),
        isAvatarMentioned: hasAvatarMention,
      });

      // Queue embedding update as a background job
      await ctx.scheduler.runAfter(0, internal.rag.updateMessageEmbedding, {
        messageId,
        messageType: "direct_message",
        content,
      });

      // Check for avatar mentions and handle them
      if (hasAvatarMention) {
        await ctx.scheduler.runAfter(0, internal.rag.handleAvatarMention, {
          messageId,
          content,
          authorId: senderId,
          receiverId,
          messageType: "direct_message",
        });
      }

      return messageId;
    } catch (error) {
      throw error;
    }
  },
});

// Get direct messages between two users
export const getDirectMessages = query({
  args: {
    userId1: v.id("users"),
    userId2: v.id("users"),
  },
  handler: async (ctx, { userId1, userId2 }) => {
    // Query messages in both directions using the by_participants index
    const messages1 = await ctx.db
      .query("direct_messages")
      .withIndex("by_participants", (q) => 
        q.eq("senderId", userId1).eq("receiverId", userId2)
      )
      .collect();

    const messages2 = await ctx.db
      .query("direct_messages")
      .withIndex("by_participants", (q) => 
        q.eq("senderId", userId2).eq("receiverId", userId1)
      )
      .collect();

    // Combine and sort messages by creation time
    const allMessages = [...messages1, ...messages2].sort(
      (a, b) => a.createdAt - b.createdAt
    );

    // Fetch author information for each message
    const messagesWithAuthors = await Promise.all(
      allMessages.map(async (message) => {
        const author = await ctx.db.get(message.senderId);
        return {
          ...message,
          author: author ? { name: author.name, email: author.email } : null,
        };
      })
    );

    return messagesWithAuthors;
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

    // Delete the attachment if it exists
    if (message.attachmentId) {
      await ctx.db.delete(message.attachmentId);
    }

    await ctx.db.delete(messageId);
    return messageId;
  },
}); 
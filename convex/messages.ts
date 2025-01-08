import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Send a new message
export const sendMessage = mutation({
  args: {
    content: v.string(),
    channelId: v.id("channels"),
    authorId: v.id("users"),
  },
  handler: async (ctx, {content, channelId, authorId }) => {
    const messageId = await ctx.db.insert("messages", {
      content,
      channelId,
      authorId,
      timestamp: Date.now(),
    });
    return messageId;
  },
});

export const sendThreadMessage = mutation({
  args: {
    content: v.string(),
    threadId: v.id("messages"),
    authorId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Get the original message to get the channel ID
    const originalMessage = await ctx.db.get(args.threadId);
    if (!originalMessage) throw new Error("Original message not found");

    // Insert the thread reply
    const messageId = await ctx.db.insert("messages", {
      content: args.content,
      channelId: originalMessage.channelId,
      authorId: args.authorId,
      timestamp: Date.now(),
      threadId: args.threadId,
    });

    // Update original message
    await ctx.db.patch(args.threadId, {
      hasThreadReplies: true,
      replyCount: (originalMessage.replyCount || 0) + 1,
    });

    return messageId;
  },
});

// Get messages for a channel
export const getMessages = query({
  args: {
    channelId: v.id("channels"),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .filter((q) => q.eq(q.field("channelId"), args.channelId))
      .filter((q) => q.eq(q.field("threadId"), undefined))
      .order("asc")
      .take(50);

    // Get all unique author IDs
    const authorIds = new Set(messages.map(msg => msg.authorId));

    // Fetch all authors in one query
    const authors = await Promise.all(
      Array.from(authorIds).map(id => ctx.db.get(id))
    );

    // Create a map of author IDs to author data, filtering out null values
    const authorMap = new Map(
      authors
        .filter((author): author is NonNullable<typeof author> => author !== null)
        .map(author => [author._id, author])
    );

    // Combine messages with author data
    return messages.map(message => ({
      ...message,
      author: authorMap.get(message.authorId) || { name: 'Deleted User', email: '' },
    }));
  },
});

export const listThreadMessages = query({
  args: {
    threadId: v.id("messages"),
  },
  handler: async (ctx, { threadId }) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_thread", (q) => q.eq("threadId", threadId))
      .order("asc")
      .collect();

    const authorIds = new Set(messages.map(msg => msg.authorId));
    const authors = await Promise.all(
      Array.from(authorIds).map(id => ctx.db.get(id))
    );

    const authorMap = new Map(
      authors
        .filter((author): author is NonNullable<typeof author> => author !== null)
        .map(author => [author._id, author])
    );

    return messages.map(message => ({
      ...message,
      author: authorMap.get(message.authorId) || { name: 'Deleted User', email: '' },
    }));
  },
});

export const editMessage = mutation({
  args: {
    messageId: v.id("messages"),
    content: v.string(),
    authorId: v.id("users"),
  },
  handler: async (ctx, { messageId, content, authorId }) => {
    const message = await ctx.db.get(messageId);
    if (!message) throw new Error("Message not found");
    
    // Verify the author is editing their own message
    if (message.authorId !== authorId) {
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

export const deleteMessage = mutation({
  args: {
    messageId: v.id("messages"),
    authorId: v.id("users"),
  },
  handler: async (ctx, { messageId, authorId }) => {
    const message = await ctx.db.get(messageId);
    if (!message) throw new Error("Message not found");
    
    // Verify the author is deleting their own message
    if (message.authorId !== authorId) {
      throw new Error("Unauthorized: Can only delete your own messages");
    }

    // If this is a parent message with thread replies, we should handle it differently
    if (message.hasThreadReplies) {
      // Instead of deleting, mark it as deleted by updating the content
      await ctx.db.patch(messageId, {
        content: "[Message deleted]",
      });
    } else {
      // If no thread replies, we can safely delete the message
      await ctx.db.delete(messageId);
    }

    return messageId;
  },
}); 
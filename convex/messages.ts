import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

// Send a new message
export const sendMessage = mutation({
  args: {
    content: v.string(),
    authorId: v.id("users"),
    channelId: v.id("channels"),
    isAvatarMessage: v.optional(v.boolean()),
    replyToId: v.optional(v.id("messages")),
    attachmentId: v.optional(v.id("attachments")),
  },
  handler: async (ctx, args) => {
    // Insert the message
    const messageId = await ctx.db.insert("messages", {
      content: args.content,
      authorId: args.authorId,
      channelId: args.channelId,
      createdAt: Date.now(),
      isAvatarMessage: args.isAvatarMessage,
      replyToId: args.replyToId,
      attachmentId: args.attachmentId,
    });

    // Queue embedding generation as a background job
    await ctx.scheduler.runAfter(0, internal.rag.updateMessageEmbedding, {
      messageId,
      messageType: "message",
      content: args.content,
    });

    // Check for avatar mentions and handle them
    await ctx.scheduler.runAfter(0, internal.rag.handleAvatarMention, {
      messageId,
      channelId: args.channelId,
      content: args.content,
      authorId: args.authorId,
      messageType: "message",
    });

    return messageId;
  },
});

export const sendThreadMessage = mutation({
  args: {
    content: v.string(),
    threadId: v.id("messages"),
    authorId: v.id("users"),
    attachmentId: v.optional(v.id("attachments")),
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
      attachmentId: args.attachmentId,
    });

    // Update original message
    await ctx.db.patch(args.threadId, {
      hasThreadReplies: true,
      replyCount: (originalMessage.replyCount || 0) + 1,
    });

    // If there's an attachment, update it with the message ID
    if (args.attachmentId) {
      await ctx.db.patch(args.attachmentId, {
        messageId,
      });
    }

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
      .withIndex("by_channel")
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

    // Get all attachment IDs
    const attachmentIds = messages
      .map(msg => msg.attachmentId)
      .filter((id): id is Id<"attachments"> => id !== undefined);

    // Fetch all attachments in one query
    const attachments = await Promise.all(
      attachmentIds.map(id => ctx.db.get(id))
    );

    // Create a map of attachment IDs to attachment data
    const attachmentMap = new Map(
      attachments
        .filter((attachment): attachment is NonNullable<typeof attachment> => attachment !== null)
        .map(attachment => [attachment._id, attachment])
    );

    // Combine messages with author and attachment data
    return messages.map(message => ({
      ...message,
      author: authorMap.get(message.authorId) || { name: 'Deleted User', email: '' },
      attachment: message.attachmentId ? attachmentMap.get(message.attachmentId) : undefined,
    }));
  },
});

// Update thread reply count
export const updateThreadReplyCount = mutation({
  args: {
    threadId: v.id("messages"),
  },
  handler: async (ctx, { threadId }) => {
    const replies = await ctx.db
      .query("messages")
      .withIndex("by_thread")
      .filter((q) => q.eq(q.field("threadId"), threadId))
      .collect();

    await ctx.db.patch(threadId, {
      replyCount: replies.length,
      hasThreadReplies: replies.length > 0,
    });

    return replies.length;
  },
});

export const listThreadMessages = query({
  args: {
    threadId: v.id("messages"),
  },
  handler: async (ctx, { threadId }) => {
    // Get all thread replies
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_thread")
      .filter((q) => q.eq(q.field("threadId"), threadId))
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

    // Get all attachment IDs
    const attachmentIds = messages
      .map(msg => msg.attachmentId)
      .filter((id): id is Id<"attachments"> => id !== undefined);

    // Fetch all attachments in one query
    const attachments = await Promise.all(
      attachmentIds.map(id => ctx.db.get(id))
    );

    // Create a map of attachment IDs to attachment data
    const attachmentMap = new Map(
      attachments
        .filter((attachment): attachment is NonNullable<typeof attachment> => attachment !== null)
        .map(attachment => [attachment._id, attachment])
    );

    return messages.map(message => ({
      ...message,
      author: authorMap.get(message.authorId) || { name: 'Deleted User', email: '' },
      attachment: message.attachmentId ? attachmentMap.get(message.attachmentId) : undefined,
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
      // Delete the attachment if it exists
      if (message.attachmentId) {
        await ctx.db.delete(message.attachmentId);
      }
      // Delete the message
      await ctx.db.delete(messageId);
    }

    return messageId;
  },
});

export const listChannelMessages = query({
  args: {
    channelId: v.id("channels"),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_channel")
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

    // Get all attachment IDs
    const attachmentIds = messages
      .map(msg => msg.attachmentId)
      .filter((id): id is Id<"attachments"> => id !== undefined);

    // Fetch all attachments in one query
    const attachments = await Promise.all(
      attachmentIds.map(id => ctx.db.get(id))
    );

    // Create a map of attachment IDs to attachment data
    const attachmentMap = new Map(
      attachments
        .filter((attachment): attachment is NonNullable<typeof attachment> => attachment !== null)
        .map(attachment => [attachment._id, attachment])
    );

    // Get thread reply counts for each message
    const threadReplyCounts = await Promise.all(
      messages.map(async (msg) => {
        if (!msg.hasThreadReplies) return 0;
        const replies = await ctx.db
          .query("messages")
          .withIndex("by_thread")
          .filter((q) => q.eq(q.field("threadId"), msg._id))
          .collect();
        return replies.length;
      })
    );

    // Map messages with author and attachment data
    return messages.map((message, index) => ({
      ...message,
      author: authorMap.get(message.authorId) || { name: 'Deleted User', email: '' },
      attachment: message.attachmentId ? attachmentMap.get(message.attachmentId) : undefined,
      replyCount: threadReplyCounts[index],
    }));
  },
});

export const get = query({
  args: { id: v.id("messages") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

export const updateMessageAudio = internalMutation({
  args: { 
    messageId: v.union(v.id("messages"), v.id("direct_messages")),
    storageId: v.string()
  },
  handler: async (ctx, args: { messageId: Id<"messages"> | Id<"direct_messages">; storageId: string }) => {
    await ctx.db.patch(args.messageId, {
      ttsAudioId: args.storageId
    });
  },
}); 
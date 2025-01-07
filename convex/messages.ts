import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Send a new message
export const sendMessage = mutation({
  args: {
    content: v.string(),
    channelId: v.id("channels"),
    authorId: v.id("users"),
  },
  handler: async (ctx, { content, channelId, authorId }) => {
    const messageId = await ctx.db.insert("messages", {
      content,
      channelId,
      authorId,
      createdAt: Date.now(),
    });
    return messageId;
  },
});

// Get messages for a channel
export const getMessages = query({
  args: { channelId: v.id("channels") },
  handler: async (ctx, { channelId }) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_channel", (q) => q.eq("channelId", channelId))
      .collect();

    // Get all unique author IDs from the messages
    const authorIds = new Set(messages.map((msg) => msg.authorId));
    
    // Fetch all authors in one query
    const authors = await ctx.db
      .query("users")
      .collect();
    
    // Create a map of author IDs to author data
    const authorMap = new Map(
      authors
        .filter(author => authorIds.has(author._id))
        .map(author => [author._id.toString(), author])
    );

    // Sort messages by createdAt and combine with author data
    return messages
      .sort((a, b) => a.createdAt - b.createdAt)
      .map(message => ({
        ...message,
        author: authorMap.get(message.authorId.toString()),
      }));
  },
}); 
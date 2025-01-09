import { query } from "./_generated/server";
import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";

interface EnrichedChannelMessage extends Doc<"messages"> {
  type: 'channel_message';
  author: { name: string; email: string };
  channel: { name: string };
}

interface EnrichedDirectMessage extends Doc<"direct_messages"> {
  type: 'direct_message';
  author: { name: string; email: string };
  recipient: { name: string; email: string };
}

type SearchResult = EnrichedChannelMessage | EnrichedDirectMessage;

// Search across all messages (both channel messages and DMs)
export const searchAllMessages = query({
  args: {
    query: v.string(),
    channelId: v.optional(v.id("channels")),
    userId: v.optional(v.id("users")),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20; // Default to 20 results
    const queryLower = args.query.toLowerCase();

    // Search channel messages
    let channelMessages: Doc<"messages">[] = [];
    
    // Use the appropriate index based on filters
    if (args.channelId) {
      channelMessages = await ctx.db
        .query("messages")
        .withIndex("by_channel")
        .filter((q) => q.eq(q.field("channelId"), args.channelId))
        .collect();
    } else if (args.userId) {
      channelMessages = await ctx.db
        .query("messages")
        .withIndex("by_author")
        .filter((q) => q.eq(q.field("authorId"), args.userId))
        .collect();
    } else if (args.startDate !== undefined) {
      channelMessages = await ctx.db
        .query("messages")
        .withIndex("by_creation")
        .filter((q) => q.gte(q.field("createdAt"), args.startDate!))
        .collect();
    } else {
      channelMessages = await ctx.db
        .query("messages")
        .collect();
    }

    // Client-side filtering for text search and date range
    const filteredChannelMessages = channelMessages
      .filter(msg => {
        const matchesQuery = msg.content.toLowerCase().includes(queryLower);
        const matchesEndDate = args.endDate === undefined || (msg.createdAt || 0) <= args.endDate;
        return matchesQuery && matchesEndDate;
      })
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
      .slice(0, limit);

    // Get user details for messages
    const userIds = new Set(filteredChannelMessages.map(msg => msg.authorId));
    const users = await Promise.all(
      Array.from(userIds).map(id => ctx.db.get(id))
    );
    const userMap = new Map(
      users
        .filter((user): user is NonNullable<Doc<"users">> => user !== null)
        .map(user => [user._id, user])
    );

    // Add user and channel details to messages
    const channelIds = new Set(filteredChannelMessages.map(msg => msg.channelId));
    const channels = await Promise.all(
      Array.from(channelIds).map(id => ctx.db.get(id))
    );
    const channelMap = new Map(
      channels
        .filter((channel): channel is NonNullable<Doc<"channels">> => channel !== null)
        .map(channel => [channel._id, channel])
    );

    const enrichedChannelMessages = filteredChannelMessages.map(msg => ({
      ...msg,
      type: 'channel_message' as const,
      author: userMap.get(msg.authorId) || { name: 'Deleted User', email: '' },
      channel: channelMap.get(msg.channelId) || { name: 'Deleted Channel' },
    }));

    // Search direct messages if no specific channel is requested
    let enrichedDirectMessages: EnrichedDirectMessage[] = [];
    if (!args.channelId) {
      let directMessages: Doc<"direct_messages">[] = [];

      // Use the appropriate index based on filters
      if (args.userId) {
        directMessages = await ctx.db
          .query("direct_messages")
          .withIndex("by_sender")
          .filter((q) => q.eq(q.field("senderId"), args.userId))
          .collect();
      } else if (args.startDate !== undefined) {
        directMessages = await ctx.db
          .query("direct_messages")
          .withIndex("by_creation")
          .filter((q) => q.gte(q.field("createdAt"), args.startDate!))
          .collect();
      } else {
        directMessages = await ctx.db
          .query("direct_messages")
          .collect();
      }

      // Client-side filtering for text search and date range
      const filteredDirectMessages = directMessages
        .filter(msg => {
          const matchesQuery = msg.content.toLowerCase().includes(queryLower);
          const matchesEndDate = args.endDate === undefined || msg.createdAt <= args.endDate;
          return matchesQuery && matchesEndDate;
        })
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, limit);

      // Get additional user IDs from DMs
      const dmUserIds = new Set([
        ...filteredDirectMessages.map(msg => msg.senderId),
        ...filteredDirectMessages.map(msg => msg.receiverId),
      ]);
      const dmUsers = await Promise.all(
        Array.from(dmUserIds).map(id => ctx.db.get(id))
      );
      const dmUserMap = new Map(
        dmUsers
          .filter((user): user is NonNullable<Doc<"users">> => user !== null)
          .map(user => [user._id, user])
      );

      enrichedDirectMessages = filteredDirectMessages.map(msg => ({
        ...msg,
        type: 'direct_message' as const,
        author: dmUserMap.get(msg.senderId) || { name: 'Deleted User', email: '' },
        recipient: dmUserMap.get(msg.receiverId) || { name: 'Deleted User', email: '' },
      }));
    }

    // Combine and sort all messages by creation date
    const allMessages: SearchResult[] = [...enrichedChannelMessages, ...enrichedDirectMessages]
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
      .slice(0, limit);

    return allMessages;
  },
}); 
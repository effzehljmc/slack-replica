import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// A mutation for creating a new channel with a given name.
export const createChannel = mutation({
  args: {
    name: v.string(),
    createdBy: v.id("users"),
  },
  handler: async (ctx, { name, createdBy }) => {
    const channelId = await ctx.db.insert("channels", {
      name,
      createdBy,
      isPrivate: false,
      members: [createdBy],
      createdAt: Date.now(),
      description: `Welcome to #${name}!`,
    });
    return channelId;
  }
});

// A query for listing all channels.
export const listChannels = query(async (ctx) => {
  return await ctx.db
    .query("channels")
    .collect();
});
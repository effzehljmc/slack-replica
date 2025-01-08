import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// List all users except the current user
export const listUsers = query({
  args: { currentUserId: v.id("users") },
  handler: async (ctx, { currentUserId }) => {
    const users = await ctx.db
      .query("users")
      .collect();
    
    return users.filter(user => user._id !== currentUserId);
  },
});

// Get user status
export const getUserStatus = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    return user?.status || 'offline';
  },
});

// Update user status
export const updateStatus = mutation({
  args: {
    userId: v.id("users"),
    status: v.union(v.literal("online"), v.literal("offline"), v.literal("away"), v.literal("active")),
  },
  handler: async (ctx, { userId, status }) => {
    await ctx.db.patch(userId, { status });
    return status;
  },
}); 
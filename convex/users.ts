import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// List all users except the current user
export const listUsers = query({
  args: { currentUserId: v.id("users") },
  handler: async (ctx, { currentUserId }) => {
    const users = await ctx.db
      .query("users")
      .collect();
    
    const now = Date.now();
    const OFFLINE_THRESHOLD = 5 * 60 * 1000; // 5 minutes

    return users
      .filter(user => user._id !== currentUserId)
      .map(user => {
        // If user has never been seen or hasn't been seen in 5 minutes, they're offline
        if (!user.lastSeenAt || (now - user.lastSeenAt > OFFLINE_THRESHOLD)) {
          return { ...user, status: 'offline' as const };
        }

        // If status is not explicitly set to 'online' or 'away', set to 'offline'
        if (!user.status || !['online', 'away'].includes(user.status)) {
          return { ...user, status: 'offline' as const };
        }

        // Keep existing status if it's valid
        return user;
      });
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
    status: v.union(v.literal("online"), v.literal("offline"), v.literal("away")),
  },
  handler: async (ctx, { userId, status }) => {
    const now = Date.now();
    await ctx.db.patch(userId, { 
      status,
      lastSeenAt: now
    });
    return status;
  },
}); 
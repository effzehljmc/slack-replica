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

// Update user status
export const updateStatus = mutation({
  args: {
    userId: v.id("users"),
    status: v.string(),
  },
  handler: async (ctx, { userId, status }) => {
    await ctx.db.patch(userId, { status });
  },
}); 
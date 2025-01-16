import { query, mutation, internalQuery } from "./_generated/server";
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

// Update user voice description
export const updateVoiceDescription = mutation({
  args: {
    userId: v.id("users"),
    voiceDescription: v.string(),
  },
  handler: async (ctx, { userId, voiceDescription }) => {
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(userId, { 
      voiceDescription
    });
    return voiceDescription;
  },
});

export const updateVoiceModel = mutation({
  args: {
    userId: v.id('users'),
    modelId: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId, modelId } = args;

    // Update the user's voice model ID
    await ctx.db.patch(userId, {
      voiceModelId: modelId,
    });
  },
});

export const getUser = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db.get(userId);
  },
});

export const setCustomVoiceModel = mutation({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, { userId }) => {
    console.log('[Debug] Starting setCustomVoiceModel mutation', { userId });
    
    // Get current user data
    const user = await ctx.db.get(userId);
    console.log('[Debug] Current user data:', user);

    // Update the user's voice model ID with Lukas's model
    const modelId = '6a5f12ab1ebd4952afe776a80d4f3307';
    console.log('[Debug] Applying voice model:', { modelId });
    
    try {
      await ctx.db.patch(userId, {
        voiceModelId: modelId,
        voiceId: undefined // Clear voiceId when using a custom model
      });
      console.log('[Debug] Successfully updated user with voice model');
      return { success: true };
    } catch (error) {
      console.error('[Debug] Failed to update user with voice model:', error);
      throw error;
    }
  },
}); 
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const generateUploadUrl = mutation({
  args: {
    fileSize: v.number(),
    fileType: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    console.log("Generating upload URL with args:", args);

    // Get user from database
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Generate and return the upload URL
    const uploadUrl = await ctx.storage.generateUploadUrl();
    console.log("Generated upload URL:", uploadUrl);
    return uploadUrl;
  },
});

export const generateDownloadUrl = query({
  args: {
    storageId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

export const saveAttachment = mutation({
  args: {
    fileName: v.string(),
    fileType: v.string(),
    fileSize: v.number(),
    storageId: v.string(),
    messageId: v.optional(v.union(v.id("messages"), v.id("direct_messages"))),
    channelId: v.optional(v.id("channels")),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    console.log("Saving attachment with args:", args);

    // Get user from database
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    try {
      const attachmentData = {
        fileName: args.fileName,
        fileType: args.fileType,
        fileSize: args.fileSize,
        storageId: args.storageId,
        uploadedBy: args.userId,
        messageId: args.messageId,
        channelId: args.channelId,
        createdAt: Date.now(),
      };

      console.log("Attempting to save attachment data:", attachmentData);

      const attachment = await ctx.db.insert("attachments", attachmentData);
      console.log("Saved attachment:", attachment);

      return attachment;
    } catch (error) {
      console.error("Error saving attachment:", error);
      throw new Error("Failed to save attachment metadata: " + (error instanceof Error ? error.message : "Unknown error"));
    }
  },
});

export const getAttachment = query({
  args: { id: v.id("attachments") },
  handler: async (ctx, args) => {
    const attachment = await ctx.db.get(args.id);
    if (!attachment) {
      return null;
    }
    return attachment;
  },
});

export const getStorageUrl = query({
  args: { storageId: v.string() },
  handler: async (ctx, { storageId }) => {
    return await ctx.storage.getUrl(storageId);
  },
}); 
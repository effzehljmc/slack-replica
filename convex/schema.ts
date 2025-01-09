import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  messages: defineTable({
    content: v.string(),
    authorId: v.id("users"),
    channelId: v.id("channels"),
    timestamp: v.optional(v.number()),
    createdAt: v.optional(v.number()),
    threadId: v.optional(v.id("messages")),
    hasThreadReplies: v.optional(v.boolean()),
    replyCount: v.optional(v.number()),
    isEdited: v.optional(v.boolean()),
    editedAt: v.optional(v.number()),
    attachmentId: v.optional(v.id("attachments")),
  })
    .index("by_thread", ["threadId"])
    .index("by_channel", ["channelId"])
    .index("by_author", ["authorId"])
    .index("by_creation", ["createdAt"]),

  typing_indicators: defineTable({
    userId: v.id("users"),
    channelId: v.optional(v.id("channels")),
    receiverId: v.optional(v.id("users")),
    chatType: v.union(v.literal("channel"), v.literal("direct")),
    lastTypedAt: v.number(),
  })
    .index("by_channel", ["channelId"])
    .index("by_direct", ["receiverId"]),

  reactions: defineTable({
    messageId: v.optional(v.id("messages")),
    targetId: v.optional(v.union(v.id("messages"), v.id("direct_messages"))),
    targetType: v.optional(v.union(v.literal("message"), v.literal("direct_message"))),
    userId: v.id("users"),
    emoji: v.string(),
    createdAt: v.number(),
  }).index("by_target", ["targetId", "targetType"]),

  channels: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    createdBy: v.id("users"),
    isPrivate: v.optional(v.boolean()),
    members: v.optional(v.array(v.id("users"))),
    createdAt: v.number(),
  }),

  users: defineTable({
    name: v.string(),
    email: v.string(),
    hashedPassword: v.string(),
    tokenIdentifier: v.string(),
    status: v.optional(v.union(v.literal("online"), v.literal("offline"), v.literal("away"))),
    lastSeenAt: v.optional(v.number()),
  })
    .index("by_email", ["email"]),

  direct_messages: defineTable({
    content: v.string(),
    senderId: v.id("users"),
    receiverId: v.id("users"),
    createdAt: v.number(),
    isEdited: v.optional(v.boolean()),
    editedAt: v.optional(v.number()),
    attachmentId: v.optional(v.id("attachments")),
  })
    .index("by_participants", ["senderId", "receiverId"])
    .index("by_participants_reverse", ["receiverId", "senderId"])
    .index("by_sender", ["senderId"])
    .index("by_receiver", ["receiverId"])
    .index("by_creation", ["createdAt"]),

  attachments: defineTable({
    fileName: v.string(),
    fileType: v.string(),
    fileSize: v.number(),
    storageId: v.string(),
    uploadedBy: v.id("users"),
    messageId: v.optional(v.union(v.id("messages"), v.id("direct_messages"))),
    channelId: v.optional(v.id("channels")),
    createdAt: v.number(),
  }),
});
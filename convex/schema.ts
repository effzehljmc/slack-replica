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
    isAvatarMessage: v.optional(v.boolean()),
    replyToId: v.optional(v.id("messages")),
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
    autoAvatarEnabled: v.optional(v.boolean()),
    avatarStyle: v.optional(v.string()),
    avatarTraits: v.optional(v.array(v.string())),
  })
    .index("by_email", ["email"]),

  direct_messages: defineTable({
    content: v.string(),
    senderId: v.id("users"),
    receiverId: v.id("users"),
    createdAt: v.number(),
    attachmentId: v.optional(v.id("attachments")),
    isEdited: v.optional(v.boolean()),
    editedAt: v.optional(v.number()),
    isAvatarMessage: v.optional(v.boolean()),
    replyToId: v.optional(v.id("direct_messages")),
    isAvatarMentioned: v.optional(v.boolean()),
  })
    .index("by_sender", ["senderId"])
    .index("by_receiver", ["receiverId"])
    .index("by_participants", ["senderId", "receiverId"]),

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

  embeddings: defineTable({
    messageId: v.optional(v.id("messages")),
    directMessageId: v.optional(v.id("direct_messages")),
    userId: v.id("users"),
    channelId: v.optional(v.id("channels")),
    embedding: v.array(v.float64()), // Store as array of float64 for OpenAI's text-embedding-ada-002
    createdAt: v.number(),
    lastUpdated: v.number(), // Track when embedding was last updated
    version: v.number(), // Track embedding model version
  })
    .vectorIndex("by_embedding", {
      vectorField: "embedding",
      dimensions: 1536,
    })
    .index("by_message", ["messageId"])
    .index("by_dm", ["directMessageId"])
    .index("by_user", ["userId"]),
});
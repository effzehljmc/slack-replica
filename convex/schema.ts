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
  }).index("by_thread", ["threadId"]),

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
    status: v.optional(v.string()),
  })
    .index("by_email", ["email"]),

  direct_messages: defineTable({
    content: v.string(),
    senderId: v.id("users"),
    receiverId: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_participants", ["senderId", "receiverId"])
    .index("by_participants_reverse", ["receiverId", "senderId"]),
});
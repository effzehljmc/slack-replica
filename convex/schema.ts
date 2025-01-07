import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    hashedPassword: v.string(),
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    tokenIdentifier: v.string(),
    status: v.optional(v.string()), // online/offline status
  })
    .index("by_token", ["tokenIdentifier"])
    .index("by_email", ["email"]),
    
  channels: defineTable({
    name: v.string(),
    createdBy: v.id("users"), // user ID who created the channel
    createdAt: v.number(), // timestamp
  }).index("by_name", ["name"]),

  messages: defineTable({
    content: v.string(),
    channelId: v.id("channels"),
    authorId: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_channel", ["channelId", "createdAt"])
    .index("by_author", ["authorId"]),

  direct_messages: defineTable({
    content: v.string(),
    senderId: v.id("users"),
    receiverId: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_participants", ["senderId", "receiverId", "createdAt"])
    .index("by_participants_reverse", ["receiverId", "senderId", "createdAt"]),
});
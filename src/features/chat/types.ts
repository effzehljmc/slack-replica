import { Id } from "../../../convex/_generated/dataModel";

// The raw message type from Convex
export interface ConvexMessage {
  _id: Id<"messages">;
  content: string;
  authorId: Id<"users">;
  channelId: Id<"channels">;
  timestamp?: number;
  createdAt?: number;
  threadId?: Id<"messages">;
  hasThreadReplies?: boolean;
  replyCount?: number;
}

// The message type with resolved author information
export interface Message {
  _id: Id<"messages">;
  content: string;
  authorId: Id<"users">;
  author?: {
    name: string;
    email: string;
  };
  channelId: Id<"channels">;
  timestamp?: number;
  createdAt?: number;
  threadId?: Id<"messages">;
  hasThreadReplies?: boolean;
  replyCount?: number;
}

export interface Thread {
  _id: Id<"messages">;
  originalMessageId: Id<"messages">;
  channelId: Id<"channels">;
  lastReplyTimestamp: number;
  replyCount: number;
} 
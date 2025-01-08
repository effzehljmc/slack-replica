import { Id } from "../../../convex/_generated/dataModel";

// Base message interface with common properties
interface BaseMessage {
  _id: Id<"messages"> | Id<"direct_messages">;
  content: string;
  authorId: Id<"users">;
  author?: {
    name: string;
    email: string;
  };
  timestamp?: number;
  createdAt?: number;
}

// Regular channel message
export interface ChannelMessage extends BaseMessage {
  _id: Id<"messages">;
  channelId: Id<"channels">;
  threadId?: Id<"messages">;
  hasThreadReplies?: boolean;
  replyCount?: number;
  isEdited?: boolean;
  editedAt?: number;
}

// Direct message
export interface DirectMessage extends BaseMessage {
  _id: Id<"direct_messages">;
  senderId: Id<"users">;
  receiverId: Id<"users">;
  isEdited?: boolean;
  editedAt?: number;
}

// Union type for all message types
export type Message = ChannelMessage | DirectMessage;

// Helper type guard to check if a message is a direct message
export function isDirectMessage(message: Message): message is DirectMessage {
  return '_id' in message && 'senderId' in message && 'receiverId' in message;
}

// Helper type guard to check if a message is a channel message
export function isChannelMessage(message: Message): message is ChannelMessage {
  return '_id' in message && 'channelId' in message;
}

export interface Thread {
  _id: Id<"messages">;
  originalMessageId: Id<"messages">;
  channelId: Id<"channels">;
  lastReplyTimestamp: number;
  replyCount: number;
} 
import { mutation, internalAction, internalMutation, internalQuery, query, action, ActionCtx } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { internal } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";

// Internal query to get message details
export const getMessage = internalQuery({
  args: {
    messageId: v.union(v.id("messages"), v.id("direct_messages")),
    messageType: v.union(v.literal("message"), v.literal("direct_message")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.messageId);
  },
});

// Change to internalMutation since it's called by internal actions
export const storeMessageEmbedding = internalMutation({
  args: {
    messageId: v.optional(v.id("messages")),
    directMessageId: v.optional(v.id("direct_messages")),
    userId: v.id("users"),
    channelId: v.optional(v.id("channels")),
    embedding: v.array(v.float64()),
    version: v.number(),
  },
  handler: async (ctx, args) => {
    try {
      // Validate that at least one message type is provided
      if (!args.messageId && !args.directMessageId) {
        throw new ConvexError({
          code: "BAD_REQUEST",
          message: "Either messageId or directMessageId must be provided",
        });
      }

      // Check if an embedding already exists for this message
      const existingEmbedding = args.messageId 
        ? await ctx.db
            .query("embeddings")
            .withIndex("by_message", (q) => q.eq("messageId", args.messageId))
            .first()
        : await ctx.db
            .query("embeddings")
            .withIndex("by_dm", (q) => q.eq("directMessageId", args.directMessageId!))
            .first();

      const now = Date.now();

      if (existingEmbedding) {
        // Update existing embedding
        await ctx.db.patch(existingEmbedding._id, {
          embedding: args.embedding,
          lastUpdated: now,
          version: args.version,
        });
        return { success: true, id: existingEmbedding._id, updated: true };
      }

      // Insert new embedding
      const id = await ctx.db.insert("embeddings", {
        messageId: args.messageId,
        directMessageId: args.directMessageId,
        userId: args.userId,
        channelId: args.channelId,
        embedding: args.embedding,
        createdAt: now,
        lastUpdated: now,
        version: args.version,
      });

      return { success: true, id, updated: false };
    } catch (error) {
      // Log error for monitoring
      console.error("Failed to store/update embedding:", error);
      throw new ConvexError({
        code: error instanceof ConvexError ? error.data.code : "INTERNAL_ERROR",
        message: error instanceof ConvexError ? error.data.message : "Failed to store/update embedding",
      });
    }
  },
}); 

export const generateEmbedding = internalAction({
  args: {
    text: v.string(),
  },
  handler: async (ctx, { text }) => {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not set");
    }

    try {
      const result = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "text-embedding-ada-002",
          input: text,
        }),
      });

      if (!result.ok) {
        const error = await result.json();
        throw new Error(`OpenAI API error: ${JSON.stringify(error)}`);
      }

      const json = await result.json();
      return json.data[0].embedding as number[];
    } catch (error) {
      console.error("Failed to generate embedding:", error);
      throw error;
    }
  },
});

export const updateMessageEmbedding = internalAction({
  args: {
    messageId: v.union(v.id("messages"), v.id("direct_messages")),
    messageType: v.union(v.literal("message"), v.literal("direct_message")),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // Generate new embedding
      const embedding = await ctx.runAction(internal.rag.generateEmbedding, {
        text: args.content,
      });

      // Get the message using our internal query
      const message = await ctx.runQuery(internal.rag.getMessage, {
        messageId: args.messageId,
        messageType: args.messageType,
      });

      if (!message) {
        throw new Error("Message not found");
      }

      // Store the new embedding with proper type handling
      if (args.messageType === "message") {
        const msg = message as Doc<"messages">;
        await ctx.runMutation(internal.rag.storeMessageEmbedding, {
          messageId: args.messageId as Id<"messages">,
          directMessageId: undefined,
          userId: msg.authorId,
          channelId: msg.channelId,
          embedding,
          version: 1,
        });
      } else {
        const msg = message as Doc<"direct_messages">;
        await ctx.runMutation(internal.rag.storeMessageEmbedding, {
          messageId: undefined,
          directMessageId: args.messageId as Id<"direct_messages">,
          userId: msg.senderId,
          channelId: undefined,
          embedding,
          version: 1,
        });
      }
    } catch (error) {
      console.error("Failed to update message embedding:", error);
      throw error;
    }
  },
});

export const handleMessageUpdate = mutation({
  args: {
    messageId: v.union(v.id("messages"), v.id("direct_messages")),
    messageType: v.union(v.literal("message"), v.literal("direct_message")),
    newContent: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // Update message content
      if (args.messageType === "message") {
        await ctx.db.patch(args.messageId, {
          content: args.newContent,
          isEdited: true,
          editedAt: Date.now(),
        });
      } else {
        await ctx.db.patch(args.messageId, {
          content: args.newContent,
          isEdited: true,
          editedAt: Date.now(),
        });
      }

      // Queue embedding update as a background job
      await ctx.scheduler.runAfter(0, internal.rag.updateMessageEmbedding, {
        messageId: args.messageId,
        messageType: args.messageType,
        content: args.newContent,
      });

      return { success: true };
    } catch (error) {
      console.error("Failed to handle message update:", error);
      throw new ConvexError({
        code: "INTERNAL_ERROR",
        message: "Failed to update message and embedding",
      });
    }
  },
});

export const retrieveTopMatches = action({
  args: {
    queryEmbedding: v.array(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (
    ctx: ActionCtx,
    { queryEmbedding, limit = 5 }: { queryEmbedding: number[]; limit?: number }
  ): Promise<Array<Doc<"embeddings"> & { _score: number }>> => {
    // Use Convex's built-in vector search
    const results = await ctx.vectorSearch("embeddings", "by_embedding", {
      vector: queryEmbedding,
      limit: limit,
    });

    // Fetch the actual documents for the results
    const matches: Array<Doc<"embeddings"> & { _score: number }> = [];
    for (const result of results) {
      const doc = await ctx.runQuery(internal.rag.getEmbeddingById, { id: result._id });
      if (doc === null) continue;
      matches.push({ ...doc, _score: result._score });
    }

    return matches;
  },
});

// Helper query to get embedding by ID
export const getEmbeddingById = internalQuery({
  args: { id: v.id("embeddings") },
  handler: async (ctx, { id }): Promise<Doc<"embeddings"> | null> => {
    return await ctx.db.get(id);
  },
});

// Test function to try out retrieval
export const testRetrieval = action({
  args: {
    testMessage: v.string(),
  },
  handler: async (
    ctx: ActionCtx,
    { testMessage }
  ): Promise<{
    queryEmbedding: number[];
    results: Array<{
      score: number;
      messageContent: string | null;
      embedding: Doc<"embeddings">;
    }>;
  }> => {
    try {
      // 1. Generate embedding for test message
      const embedding = await ctx.runAction(internal.rag.generateEmbedding, {
        text: testMessage
      });
      
      // 2. Try to find similar messages
      const matches = await ctx.vectorSearch("embeddings", "by_embedding", {
        vector: embedding,
        limit: 5,
      });

      // 3. Fetch full documents
      const results: Array<{
        score: number;
        messageContent: string | null;
        embedding: Doc<"embeddings">;
      }> = [];
      
      for (const match of matches) {
        const doc = await ctx.runQuery(internal.rag.getEmbeddingById, { id: match._id });
        if (!doc) continue;

        // 4. Get the actual message content
        let messageContent: string | null = null;
        if (doc.messageId) {
          const message = await ctx.runQuery(internal.rag.getMessage, {
            messageId: doc.messageId,
            messageType: "message"
          });
          messageContent = message?.content ?? null;
        } else if (doc.directMessageId) {
          const message = await ctx.runQuery(internal.rag.getMessage, {
            messageId: doc.directMessageId,
            messageType: "direct_message"
          });
          messageContent = message?.content ?? null;
        }

        results.push({
          score: match._score,
          messageContent,
          embedding: doc
        });
      }

      return {
        queryEmbedding: embedding,
        results
      };
    } catch (error) {
      console.error("Error in test retrieval:", error);
      throw new ConvexError({
        code: "INTERNAL_ERROR",
        message: "Failed to test retrieval"
      });
    }
  }
}); 

// Helper function to extract avatar mention and query from a message
const extractAvatarMention = (
  content: string
): { mentionedUserId: string | null; query: string | null } => {
  try {
    // Match pattern like "@User's Avatar some query here" with more flexible spacing and case
    const mentionRegex = /@([a-zA-Z0-9]+)'s\s*avatar\s+(.+)/i;
    const match = content.match(mentionRegex);
    
    if (!match) {
      return { mentionedUserId: null, query: null };
    }
    
    return {
      mentionedUserId: match[1],
      query: match[2].trim()
    };
  } catch (error) {
    return { mentionedUserId: null, query: null };
  }
};

// Function to generate response using OpenAI
export const generateResponse = internalAction({
  args: {
    prompt: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, args): Promise<string> => {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not set");
    }

    try {
      const result = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: "You are an AI avatar that responds in a personalized way based on the provided context and personality traits."
            },
            {
              role: "user",
              content: args.prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
      });

      if (!result.ok) {
        const error = await result.json();
        throw new Error(`OpenAI API error: ${JSON.stringify(error)}`);
      }

      const json = await result.json();
      return json.choices[0].message.content as string;
    } catch (error) {
      throw error;
    }
  },
});

// Internal mutation to send avatar message
export const sendAvatarMessage = internalMutation({
  args: {
    content: v.string(),
    authorId: v.id("users"),
    channelId: v.id("channels"),
    replyToId: v.id("messages"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("messages", {
      content: args.content,
      authorId: args.authorId,
      channelId: args.channelId,
      createdAt: Date.now(),
      isAvatarMessage: true,
      replyToId: args.replyToId
    });
  },
});

// Function to handle automatic avatar responses
export const handleAvatarMention = internalAction({
  args: {
    messageId: v.union(v.id("messages"), v.id("direct_messages")),
    channelId: v.optional(v.id("channels")),
    receiverId: v.optional(v.id("users")),
    content: v.string(),
    authorId: v.id("users"),
    messageType: v.union(v.literal("message"), v.literal("direct_message")),
    shouldSpeak: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    try {
      // 1. Extract mention and query
      const { mentionedUserId, query } = extractAvatarMention(args.content);
      
      if (!mentionedUserId || !query) {
        return null;
      }

      // Convert username to user ID
      const mentionedUser = await ctx.runQuery(internal.rag.getUserByName, { name: mentionedUserId });
      
      if (!mentionedUser?.autoAvatarEnabled) {
        return null;
      }

      // For DMs, validate that the mentioned user is either the sender or receiver
      if (args.messageType === "direct_message") {
        // Get the message to check participants
        const message = await ctx.runQuery(internal.rag.getMessage, {
          messageId: args.messageId,
          messageType: "direct_message"
        }) as Doc<"direct_messages"> | null;

        if (!message) {
          return null;
        }

        // Check if the mentioned user is either the sender or receiver of the DM
        const isParticipant = message.senderId === mentionedUser._id || message.receiverId === mentionedUser._id;
        
        if (!isParticipant) {
          return null;
        }
      }

      // 3. Generate embedding for the query
      const embedding = await ctx.runAction(internal.rag.generateEmbedding, {
        text: query
      });

      // 4. Find relevant messages using vector search
      const searchResults = await ctx.vectorSearch("embeddings", "by_embedding", {
        vector: embedding,
        limit: 5
      });

      // 5. Format messages for context
      const relevantMessages = [];
      for (const result of searchResults) {
        const doc = await ctx.runQuery(internal.rag.getEmbeddingById, { id: result._id });
        if (!doc) continue;

        let messageContent = null;
        let author = null;
        let timestamp = null;

        if (doc.messageId) {
          const message = await ctx.runQuery(internal.rag.getMessage, {
            messageId: doc.messageId,
            messageType: "message"
          }) as Doc<"messages"> | null;
          
          if (message) {
            const user = await ctx.runQuery(internal.rag.getUserById, { id: message.authorId });
            messageContent = message.content;
            author = user?.name ?? "Unknown";
            timestamp = message.createdAt ?? Date.now();
          }
        } else if (doc.directMessageId) {
          const message = await ctx.runQuery(internal.rag.getMessage, {
            messageId: doc.directMessageId,
            messageType: "direct_message"
          }) as Doc<"direct_messages"> | null;
          
          if (message) {
            const user = await ctx.runQuery(internal.rag.getUserById, { id: message.senderId });
            messageContent = message.content;
            author = user?.name ?? "Unknown";
            timestamp = message.createdAt;
          }
        }

        if (messageContent && author && timestamp) {
          relevantMessages.push({
            content: messageContent,
            author,
            timestamp,
            score: result._score
          });
        }
      }

      // 6. Generate the response using our prompt construction
      const prompt = await ctx.runAction(internal.rag.constructPrompt, {
        query,
        userId: mentionedUser._id,
        relevantMessages,
        personality: {
          style: mentionedUser.avatarStyle ?? "You are friendly, direct, and like to use emojis",
          traits: mentionedUser.avatarTraits ?? ["helpful", "concise", "positive"]
        },
        shouldSpeak: args.shouldSpeak
      });

      // 7. Call OpenAI for completion
      const response = await ctx.runAction(internal.rag.generateResponse, {
        prompt,
        userId: mentionedUser._id
      });

      // 8. Post the response as a new message
      if (args.messageType === "message") {
        await ctx.runMutation(internal.rag.sendAvatarMessage, {
          content: response,
          authorId: mentionedUser._id,
          channelId: args.channelId!,
          replyToId: args.messageId as Id<"messages">
        });
      } else {
        await ctx.runMutation(internal.rag.sendAvatarDirectMessage, {
          content: response,
          senderId: mentionedUser._id,
          receiverId: args.authorId,
          replyToId: args.messageId as Id<"direct_messages">
        });
      }

      return { success: true };
    } catch (error) {
      throw new Error("Failed to generate avatar response");
    }
  }
});

// Helper query to get user by name
export const getUserByName = internalQuery({
  args: { name: v.string() },
  handler: async (ctx, { name }) => {
    return await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("name"), name))
      .first();
  },
});

// Helper query to get user by ID
export const getUserById = internalQuery({
  args: { id: v.id("users") },
  handler: async (ctx, { id }): Promise<Doc<"users"> | null> => {
    return await ctx.db.get(id);
  },
});

// Helper function to format messages into a context block
const formatMessagesContext = (messages: Array<{
  content: string;
  author: string;
  timestamp: number;
  score: number;
}>): string => {
  return messages
    .sort((a, b) => b.score - a.score) // Sort by relevance
    .map(msg => {
      const date = new Date(msg.timestamp);
      return `[${msg.author}] (${date.toISOString()}): ${msg.content}`;
    })
    .join("\n");
};

// Function to construct the final prompt
export const constructPrompt = internalAction({
  args: {
    query: v.string(),
    userId: v.id("users"),
    relevantMessages: v.array(
      v.object({
        content: v.string(),
        author: v.string(),
        timestamp: v.number(),
        score: v.number(),
      })
    ),
    personality: v.object({
      style: v.string(),
      traits: v.array(v.string()),
      examples: v.optional(v.array(v.string())),
    }),
    shouldSpeak: v.optional(v.boolean()),
  },
  handler: async (ctx, args): Promise<string> => {
    console.log("[DM Debug] Constructing prompt for user:", args.userId);
    console.log("[DM Debug] Query:", args.query);
    console.log("[DM Debug] Relevant messages:", args.relevantMessages.length);

    // Get user information
    const user = await ctx.runQuery(internal.rag.getUserById, { id: args.userId });
    if (!user) {
      throw new Error("User not found");
    }

    // Format the context from relevant messages
    const contextBlock = formatMessagesContext(args.relevantMessages);

    // Construct the voice block if speech is requested
    let voiceBlock = "";
    if (args.shouldSpeak && user.voiceDescription) {
      voiceBlock = `\n\nVOICE INSTRUCTIONS: ${user.voiceDescription}\nPlease format your response in a way that follows these voice instructions while maintaining your personality.`;
    }

    // Construct the final prompt
    const prompt = `You are an AI assistant with the following personality:
Style: ${args.personality.style}
Traits: ${args.personality.traits.join(", ")}

CONVERSATION CONTEXT:
${contextBlock}

CURRENT QUERY: ${args.query}${voiceBlock}

Please respond in a way that matches your personality and style.${args.shouldSpeak ? " Remember to follow the voice instructions when crafting your response." : ""}`;

    return prompt;
  },
});

// Test function to enable auto-avatar for a user
export const enableAutoAvatar = mutation({
  args: {
    userId: v.id("users"),
    style: v.optional(v.string()),
    traits: v.optional(v.array(v.string())),
    enabled: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const defaultStyle = "You are friendly, direct, and like to use emojis";
    const defaultTraits = ["helpful", "concise", "positive"];

    await ctx.db.patch(args.userId, {
      autoAvatarEnabled: args.enabled ?? true,
      avatarStyle: args.style ?? defaultStyle,
      avatarTraits: args.traits ?? defaultTraits,
    });

    return { success: true };
  },
});

// Internal mutation to send avatar direct message
export const sendAvatarDirectMessage = internalMutation({
  args: {
    content: v.string(),
    senderId: v.id("users"),
    receiverId: v.id("users"),
    replyToId: v.id("direct_messages"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("direct_messages", {
      content: args.content,
      senderId: args.senderId,
      receiverId: args.receiverId,
      createdAt: Date.now(),
      isAvatarMessage: true,
      replyToId: args.replyToId
    });
  },
});

// Public mutation to handle voice synthesis requests
export const synthesizeVoice = action({
  args: {
    messageId: v.union(v.id("messages"), v.id("direct_messages")),
    channelId: v.optional(v.id("channels")),
    receiverId: v.optional(v.id("users")),
    content: v.string(),
    authorId: v.id("users"),
    messageType: v.union(v.literal("message"), v.literal("direct_message")),
    shouldSpeak: v.boolean(),
  },
  handler: async (ctx, args): Promise<{ success: boolean } | null> => {
    return await ctx.runAction(internal.rag.handleAvatarMention, args);
  },
}); 
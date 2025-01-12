# Retrieval-Augmented Generation (RAG) Plan

This document outlines a high-level approach to introducing an AI avatar that leverages Retrieval-Augmented Generation within our Slack Replica. We will store message embeddings directly in our Convex database, retrieve context, and feed that into a Large Language Model (LLM) to produce context-aware, user-personality-specific answers.

---

## 1. Overview of RAG

Retrieval-Augmented Generation (RAG) merges a knowledge retrieval step with a generative model. This helps the AI generate outputs that are rooted in actual Slack messages and conversations, making it more accurate and context-aware.

1. Store message embeddings in a dedicated Convex collection (e.g., "embeddings").  
2. When an AI response is needed (e.g., a user pings "@Alice's Avatar"), embed the query.  
3. Retrieve the most relevant stored embeddings via similarity search.  
4. Build a context string from the matched messages.  
5. Prompt an LLM (e.g., OpenAI GPT-4) with that context plus the user's "personality instructions."

---

## 2. Storing Embeddings

1. Create a new table in convex/schema.ts using Convex's native vector field support:
```ts
// In schema.ts
embeddings: defineTable({
  messageId: v.optional(v.id("messages")),
  directMessageId: v.optional(v.id("direct_messages")),
  userId: v.id("users"),
  channelId: v.optional(v.id("channels")),
  embedding: v.array(v.float64()), // Store as array of float64 for OpenAI's text-embedding-ada-002
  createdAt: v.number(),
  lastUpdated: v.number(), // Track when embedding was last updated
  version: v.number(), // Track embedding model version
}).vectorIndex("by_embedding", {
  vectorField: "embedding",
  dimensions: 1536,
}).index("by_message", ["messageId"])
  .index("by_dm", ["directMessageId"]);
```

Key improvements in this implementation:
- Uses `v.float64()` for precise vector storage
- References original messages instead of duplicating text
- Tracks metadata like creation time and version
- Maintains proper relationships with users and channels
- Uses vector indexing for efficient similarity search

2. Implement a robust mutation for storing and updating embeddings:

```ts
import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";

export const storeMessageEmbedding = mutation({
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
```

This mutation implementation includes several important features:

1. **Input Validation**:
   - Ensures either `messageId` or `directMessageId` is provided
   - Uses proper typing for all fields
   - Validates input through Convex's type system

2. **Upsert Logic**:
   - Checks for existing embeddings before inserting
   - Updates if exists, creates if not
   - Maintains proper timestamps for both creation and updates

3. **Error Handling**:
   - Comprehensive try-catch block
   - Custom error types for different scenarios
   - Proper error logging for monitoring

4. **Performance Considerations**:
   - Uses appropriate indexes for efficient lookups
   - Single database transaction for updates
   - Atomic operations for consistency

To use this mutation effectively, we also need to add two new indexes to our schema:

```ts
// Update the embeddings table in schema.ts to add these indexes:
embeddings: defineTable({
  // ... existing fields ...
}).vectorIndex("by_embedding", {
  vectorField: "embedding",
  dimensions: 1536,
}).index("by_message", ["messageId"])
  .index("by_dm", ["directMessageId"]);
```

3. Set up message update handlers:

We need three components to handle message updates properly:

a) OpenAI Embedding Generation:
```ts
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
```

b) Background Job for Embedding Updates:
```ts
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

      // Get the message to access user and channel info
      const message = args.messageType === "message"
        ? await ctx.runQuery(internal.messages.get, { id: args.messageId })
        : await ctx.runQuery(internal.directMessages.get, { id: args.messageId });

      if (!message) {
        throw new Error("Message not found");
      }

      // Store the new embedding
      await ctx.runMutation(internal.rag.storeMessageEmbedding, {
        messageId: args.messageType === "message" ? args.messageId : undefined,
        directMessageId: args.messageType === "direct_message" ? args.messageId : undefined,
        userId: args.messageType === "message" ? message.authorId : message.senderId,
        channelId: args.messageType === "message" ? message.channelId : undefined,
        embedding,
        version: 1,
      });
    } catch (error) {
      console.error("Failed to update message embedding:", error);
      throw error;
    }
  },
});
```

c) Message Update Handler:
```ts
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
```

Key Improvements in this Implementation:

1. **Comprehensive Message Support**:
   - Handles both regular messages and direct messages
   - Properly updates metadata (isEdited, editedAt)
   - Maintains data consistency across message types

2. **OpenAI Integration**:
   - Direct integration with OpenAI's embedding API
   - Proper error handling for API calls
   - Environment variable configuration

3. **Background Processing**:
   - Uses Convex's scheduler for non-blocking updates
   - Separates concerns between message updates and embedding generation
   - Ensures system responsiveness during updates

4. **Error Handling**:
   - Comprehensive error catching and logging
   - Proper error propagation
   - Detailed error messages for debugging

5. **Type Safety**:
   - Strong typing for all arguments
   - Union types for message types
   - Proper null checking

To use this system, you'll need to:
1. Set the OPENAI_API_KEY environment variable in your Convex deployment
2. Update message edit handlers in your UI to call handleMessageUpdate
3. Monitor the system for any embedding generation errors

Next Steps:

---

## 3. Retrieval Step

Convex provides built-in vector similarity search capabilities, which is perfect for RAG applications. We can use Convex's vector search to efficiently find the most relevant messages based on embedding similarity.

Example in "convex/rag.ts":

```ts
import { action, ActionCtx } from "./_generated/server";
import { v } from "convex/values";
import { Doc } from "./_generated/dataModel";

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
```

To enable vector search, we need to:

1. Define a vector index in our schema:
```ts
// In schema.ts
embeddings: defineTable({
  messageId: v.optional(v.id("messages")),
  directMessageId: v.optional(v.id("direct_messages")),
  userId: v.id("users"),
  channelId: v.optional(v.id("channels")),
  embedding: v.array(v.float64()), // Store as array of float64 for OpenAI's text-embedding-ada-002
  createdAt: v.number(),
  lastUpdated: v.number(), // Track when embedding was last updated
  version: v.number(), // Track embedding model version
}).vectorIndex("by_embedding", {
  vectorField: "embedding",
  dimensions: 1536, // For OpenAI's text-embedding-ada-002
});
```

Key points about vector search in Convex:

1. Vector search is only available in actions, not queries
2. The `vectorSearch` method returns results with `_id` and `_score` fields
3. Results are ordered by cosine similarity (scores range from -1 to 1)
4. You need to fetch the full documents separately using a query

This built-in functionality is much more efficient than implementing our own similarity search, especially as the dataset grows.

---

## 4. Prompt Construction

Once we have the top relevant messages:

1. Fetch the actual text from "messages" or "direct_messages."  
2. Construct a "Context" block, e.g.:  
   "Here is recent Slack Replica context:  
    [Alice] (2023-10-12 09:15): Check out the new PR.  
    [Bob] (2023-10-12 09:17): Sure, I'll review it."  

3. Add user personality instructions, e.g.,  
   "You are responding as Alice's AI Avatar. She is friendly, direct, and likes emojis. Maintain her style."  

4. Send this combined prompt to the LLM.  
5. Receive the response, and post it as "Alice's Avatar" in the appropriate channel or DM.

---

## 5. Automatic Flow vs. On-Demand

• Automatic: If a user toggles "Auto-Avatar," the system calls RAG whenever someone addresses "@Alice's Avatar."  
• On-Demand: There might be a "Generate AI Suggestion" button in the UI. The user sees the draft and can approve or edit it before sending.

---

## 6. Security & Permission Checks

• Only embed messages the user is authorized to see.  
• If a message is from a private channel, only store the embedding if the AI's user is also part of that channel (to avoid data leakage).  
• Ensure that when retrieving top matches, we filter out embeddings for channels the requesting user does not have access to.

---

## 7. Scaling Beyond Naive Retrieval

• For larger datasets, consider an external vector DB (Pinecone, Qdrant, Weaviate) or indexing solution.  
• The flow remains the same: store embeddings during message creation → retrieve top K context chunks → generate with LLM.

---

## 8. Implementation Checklist

1. Create "embeddings" collection in convex/schema.ts.  
2. Add a storeMessageEmbedding mutation in "convex/rag.ts" (or similar).  
3. Amend messages.ts and direct_messages.ts to call storeMessageEmbedding after a message is inserted.  
   • Generate embeddings client-side (or in a secure serverless function) using an embedding model like OpenAI's text-embedding-ada-002.  
4. Create a retrieveTopMatches query in "convex/rag.ts."  
5. Build a function or route in Next.js that:  
   • Receives an AI prompt.  
   • Generates an embedding.  
   • Calls retrieveTopMatches.  
   • Fetches the actual messages.  
   • Constructs a final prompt with user personality instructions.  
   • Calls LLM to get a response.  
   • Posts the response in Slack Replica as an "AI avatar message."  
6. UI changes:  
   • Let users configure their "AI avatar style" in a settings panel.  
   • Mark AI-generated messages distinctly (e.g., "Bot: Alice's Avatar").

---

## 9. Future Improvements

• Fine-Tuning or Additional Prompting: For deeper user personality replication.  
• Caching: Avoid repeated embeddings for the same text if messages remain unchanged.  
• Moderation & Filtering: Optionally use an LLM content moderation step to keep AI outputs helpful and safe.

---

## Conclusion

This plan integrates AI-driven, context-aware responses into the Slack Replica using a RAG approach—storing embeddings in Convex, retrieving relevant historical messages, and prompting an LLM for final responses in the user's "voice." As the user base or data grows, we can scale or optimize each component accordingly. 
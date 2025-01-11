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
  messageId: v.id("messages").optional(),
  directMessageId: v.id("direct_messages").optional(),
  userId: v.id("users"),
  channelId: v.id("channels").optional(),
  embedding: v.vector(1536), // Native vector field for OpenAI's text-embedding-ada-002
  createdAt: v.number(),
  lastUpdated: v.number(), // Track when embedding was last updated
  version: v.number(), // Track embedding model version
}).vectorIndex("by_embedding", {
  vectorField: "embedding",
  dimensions: 1536,
});
```

2. Implement a robust mutation for storing and updating embeddings:

```ts
import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";

export const storeMessageEmbedding = mutation({
  args: {
    messageId: v.id("messages").optional(),
    directMessageId: v.id("direct_messages").optional(),
    userId: v.id("users"),
    channelId: v.id("channels").optional(),
    embedding: v.vector(1536),
    version: v.number(),
  },
  handler: async (ctx, args) => {
    try {
      // Check if an embedding already exists for this message
      const existingEmbedding = args.messageId 
        ? await ctx.db
            .query("embeddings")
            .withIndex("by_message", q => 
              q.eq("messageId", args.messageId)
            )
            .first()
        : await ctx.db
            .query("embeddings")
            .withIndex("by_dm", q => 
              q.eq("directMessageId", args.directMessageId!)
            )
            .first();

      if (existingEmbedding) {
        // Update existing embedding
        await ctx.db.patch(existingEmbedding._id, {
          embedding: args.embedding,
          lastUpdated: Date.now(),
          version: args.version,
        });
        return existingEmbedding._id;
      }

      // Insert new embedding
      const id = await ctx.db.insert("embeddings", {
        messageId: args.messageId,
        directMessageId: args.directMessageId,
        userId: args.userId,
        channelId: args.channelId,
        embedding: args.embedding,
        createdAt: Date.now(),
        lastUpdated: Date.now(),
        version: args.version,
      });
      return id;
    } catch (error) {
      // Log error for monitoring
      console.error("Failed to store embedding:", error);
      throw new ConvexError({
        code: "INTERNAL_ERROR",
        message: "Failed to store embedding",
      });
    }
  },
});
```

3. Set up a message update handler:

```ts
export const handleMessageUpdate = mutation({
  args: {
    messageId: v.id("messages"),
    newContent: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // Update message content
      await ctx.db.patch(args.messageId, {
        content: args.newContent,
      });

      // Queue embedding update
      await ctx.scheduler.runAfter(0, "internal/updateEmbedding", {
        messageId: args.messageId,
        content: args.newContent,
      });
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

Key Improvements:

1. **Efficient Storage**:
   - Use Convex's native `v.vector()` type instead of strings or arrays
   - Eliminates need for JSON serialization/deserialization
   - Optimized for vector operations

2. **Error Handling**:
   - Comprehensive try-catch blocks
   - Proper error logging for monitoring
   - Custom error types for different failure scenarios
   - Graceful fallbacks where appropriate

3. **Embedding Updates**:
   - Track last update time and embedding version
   - Implement update detection and queueing
   - Use Convex scheduler for background processing
   - Maintain consistency between message content and embeddings

4. **Performance Optimizations**:
   - Use appropriate indexes for quick lookups
   - Batch updates when possible
   - Background processing for non-critical updates

---

## 3. Retrieval Step

Convex provides built-in vector similarity search capabilities, which is perfect for RAG applications. We can use Convex's vector search to efficiently find the most relevant messages based on embedding similarity.

Example in "convex/rag.ts":

```ts
import { query } from "./_generated/server";
import { v } from "convex/values";

export const retrieveTopMatches = query({
  args: {
    queryEmbedding: v.array(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { queryEmbedding, limit = 5 }) => {
    // Use Convex's built-in vector search
    const matches = await ctx.db
      .query("embeddings")
      .withIndex("by_embedding", (q) =>
        q.vectorSearch("embedding", queryEmbedding, limit)
      )
      .collect();

    return matches;
  },
});
```

To enable vector search, we need to:

1. Define a vector index in our schema:
```ts
// In schema.ts
embeddings: defineTable({
  messageId: v.id("messages").optional(),
  directMessageId: v.id("direct_messages").optional(),
  userId: v.id("users"),
  channelId: v.id("channels").optional(),
  embedding: v.array(v.float64()), // Store as array of float64
  createdAt: v.number(),
}).vectorIndex("by_embedding", {
  vectorField: "embedding",
  dimensions: 1536, // For OpenAI's text-embedding-ada-002
});
```

2. Use the `vectorSearch` method to find similar embeddings, which returns results ordered by cosine similarity.

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
import { query } from "./_generated/server";
import { v } from "convex/values";

export const get = query({
  args: { id: v.id("direct_messages") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
}); 
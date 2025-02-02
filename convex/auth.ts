import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { ConvexError } from "convex/values";
import * as bcrypt from "bcryptjs";
import { api } from "./_generated/api";

export const signUp = action({
  args: {
    email: v.string(),
    password: v.string(),
    name: v.string(),
  },
  async handler(ctx, args): Promise<any> {
    // Check if email already exists
    const existingUser = await ctx.runQuery(api.auth.getUser, { email: args.email });

    if (existingUser) {
      throw new ConvexError("Email already exists");
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(args.password, salt);

    // Create user
    const userId = await ctx.runMutation(api.auth.createUser, {
      email: args.email,
      hashedPassword,
      name: args.name,
      tokenIdentifier: `email:${args.email}`,
    });

    // Get and return the created user
    const user = await ctx.runQuery(api.auth.getUser, { email: args.email });
    if (!user) throw new ConvexError("Failed to create user");
    return user;
  },
});

export const createUser = mutation({
  args: {
    email: v.string(),
    hashedPassword: v.string(),
    name: v.string(),
    tokenIdentifier: v.string(),
  },
  async handler(ctx, args) {
    return await ctx.db.insert("users", {
      email: args.email,
      hashedPassword: args.hashedPassword,
      name: args.name,
      tokenIdentifier: args.tokenIdentifier,
      status: 'offline',
      lastSeenAt: Date.now(),
    });
  },
});

export const signIn = action({
  args: {
    email: v.string(),
    password: v.string(),
  },
  async handler(ctx, args): Promise<{
    _id: any;
    email: string;
    hashedPassword: string;
    name: string;
    tokenIdentifier: string;
    status?: string;
  }> {
    // Find user by email
    const user = await ctx.runQuery(api.auth.getUser, { email: args.email });

    if (!user) {
      throw new ConvexError("Invalid email or password");
    }

    // Compare password
    const isValid = await bcrypt.compare(args.password, user.hashedPassword);
    if (!isValid) {
      throw new ConvexError("Invalid email or password");
    }

    return user;
  },
});

export const getUser = query({
  args: { email: v.string() },
  async handler(ctx, args) {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!user) return null;

    return {
      ...user,
      tokenIdentifier: `email:${user.email}`,
    };
  },
}); 
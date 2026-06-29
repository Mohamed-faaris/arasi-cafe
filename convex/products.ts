import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getProducts = query({
  handler: async (ctx) => await ctx.db.query("products").order("asc").collect(),
});

export const createProduct = mutation({
  args: {
    name: v.string(),
    defaultPrice: v.number(),
    defaultQty: v.number(),
    type: v.union(v.literal("A"), v.literal("B")),
    purchasePrice: v.number(),
    uom: v.optional(v.string()),
    cgst: v.number(),
    sgst: v.number(),
  },
  handler: async (ctx, args) => await ctx.db.insert("products", args),
});

export const updateProduct = mutation({
  args: {
    id: v.id("products"),
    name: v.optional(v.string()),
    defaultPrice: v.optional(v.number()),
    defaultQty: v.optional(v.number()),
    type: v.optional(v.union(v.literal("A"), v.literal("B"))),
    purchasePrice: v.optional(v.number()),
    uom: v.optional(v.string()),
    cgst: v.optional(v.number()),
    sgst: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
    return await ctx.db.get(id);
  },
});

export const deleteProduct = mutation({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return args.id;
  },
});

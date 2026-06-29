import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getVendors = query({
  handler: async (ctx) => await ctx.db.query("vendors").order("desc").collect(),
});

export const getVendorById = query({
  args: { id: v.id("vendors") },
  handler: async (ctx, args) => await ctx.db.get(args.id),
});

export const createVendor = mutation({
  args: {
    name: v.string(),
    phone: v.string(),
    avatar: v.string(),
    dueAmount: v.optional(v.number()),
    openingBalance: v.optional(v.number()),
    gstin: v.optional(v.string()),
    address: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("vendors", {
      name: args.name,
      phone: args.phone,
      dueAmount: args.dueAmount ?? 0,
      lastTransaction: new Date().toISOString(),
      avatar: args.avatar,
      daysOverdue: 0,
      gstin: args.gstin,
      address: args.address,
      openingBalance: args.openingBalance,
    });
  },
});

export const updateVendor = mutation({
  args: {
    id: v.id("vendors"),
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    avatar: v.optional(v.string()),
    gstin: v.optional(v.string()),
    address: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
    return await ctx.db.get(id);
  },
});

export const deleteVendor = mutation({
  args: { id: v.id("vendors") },
  handler: async (ctx, args) => {
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_vendor", (q) => q.eq("vendorId", args.id))
      .collect();
    for (const tx of transactions) {
      await ctx.db.delete(tx._id);
    }
    await ctx.db.delete(args.id);
    return args.id;
  },
});

export const updateVendorDueAmount = mutation({
  args: {
    id: v.id("vendors"),
    amount: v.number(),
    daysOverdue: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const vendor = await ctx.db.get(args.id);
    if (!vendor) throw new Error("Vendor not found");
    const updates: Record<string, number | string> = {
      dueAmount: Math.max(0, vendor.dueAmount + args.amount),
      lastTransaction: new Date().toISOString(),
    };
    if (args.daysOverdue !== undefined) {
      updates.daysOverdue = args.daysOverdue;
    }
    await ctx.db.patch(args.id, updates);
    return await ctx.db.get(args.id);
  },
});

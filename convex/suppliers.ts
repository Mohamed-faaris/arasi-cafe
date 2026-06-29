import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getSuppliers = query({
  handler: async (ctx) => await ctx.db.query("suppliers").order("desc").collect(),
});

export const getSupplierById = query({
  args: { id: v.id("suppliers") },
  handler: async (ctx, args) => await ctx.db.get(args.id),
});

export const getSupplierTransactions = query({
  args: { supplierId: v.id("suppliers") },
  handler: async (ctx, args) =>
    await ctx.db
      .query("supplierTransactions")
      .withIndex("by_supplier", (q) => q.eq("supplierId", args.supplierId))
      .order("desc")
      .collect(),
});

export const createSupplier = mutation({
  args: {
    name: v.string(),
    phone: v.string(),
    avatar: v.string(),
    address: v.optional(v.string()),
  },
  handler: async (ctx, args) =>
    await ctx.db.insert("suppliers", {
      name: args.name,
      phone: args.phone,
      avatar: args.avatar,
      address: args.address,
      totalPurchases: 0,
      totalPaid: 0,
      balanceDue: 0,
      lastPurchase: new Date().toISOString(),
    }),
});

export const updateSupplier = mutation({
  args: {
    id: v.id("suppliers"),
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    avatar: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
    return await ctx.db.get(id);
  },
});

export const deleteSupplier = mutation({
  args: { id: v.id("suppliers") },
  handler: async (ctx, args) => {
    const txs = await ctx.db
      .query("supplierTransactions")
      .withIndex("by_supplier", (q) => q.eq("supplierId", args.id))
      .collect();
    for (const tx of txs) {
      await ctx.db.delete(tx._id);
    }
    await ctx.db.delete(args.id);
    return args.id;
  },
});

export const createSupplierTransaction = mutation({
  args: {
    type: v.union(v.literal("purchase"), v.literal("payment")),
    supplierId: v.id("suppliers"),
    supplierName: v.string(),
    amount: v.number(),
    date: v.string(),
    notes: v.optional(v.string()),
    paymentMethod: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const txId = await ctx.db.insert("supplierTransactions", {
      type: args.type,
      supplierId: args.supplierId,
      supplierName: args.supplierName,
      amount: args.amount,
      date: args.date,
      notes: args.notes,
      paymentMethod: args.paymentMethod,
    });

    const supplier = await ctx.db.get(args.supplierId);
    if (supplier) {
      const isPurchase = args.type === "purchase";
      await ctx.db.patch(args.supplierId, {
        balanceDue: Math.max(0, supplier.balanceDue + (isPurchase ? args.amount : -args.amount)),
        totalPurchases: isPurchase ? supplier.totalPurchases + args.amount : supplier.totalPurchases,
        totalPaid: !isPurchase ? supplier.totalPaid + args.amount : supplier.totalPaid,
        lastPurchase: args.date,
      });
    }

    return txId;
  },
});

export const deleteSupplierTransaction = mutation({
  args: { id: v.id("supplierTransactions") },
  handler: async (ctx, args) => {
    const tx = await ctx.db.get(args.id);
    if (!tx) throw new Error("Transaction not found");

    const supplier = await ctx.db.get(tx.supplierId);
    if (supplier) {
      const isPurchase = tx.type === "purchase";
      await ctx.db.patch(tx.supplierId, {
        balanceDue: Math.max(0, supplier.balanceDue + (isPurchase ? -tx.amount : tx.amount)),
        totalPurchases: isPurchase ? supplier.totalPurchases - tx.amount : supplier.totalPurchases,
        totalPaid: !isPurchase ? supplier.totalPaid - tx.amount : supplier.totalPaid,
      });
    }

    await ctx.db.delete(args.id);
    return args.id;
  },
});

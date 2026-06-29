import { query } from "./_generated/server";

export const getStats = query({
  handler: async (ctx) => {
    const [transactions, vendors] = await Promise.all([
      ctx.db.query("transactions").collect(),
      ctx.db.query("vendors").collect(),
    ]);

    const totalBills = transactions.filter((t) => t.type === "bill");
    const totalPayments = transactions.filter((t) => t.type === "payment");

    return {
      totalRevenue: totalBills.reduce((s, t) => s + t.amount, 0),
      totalProfit: totalBills.reduce((s, t) => s + t.profit, 0),
      totalCollections: totalPayments.reduce((s, t) => s + t.amount, 0),
      totalDue: vendors.reduce((s, v) => s + v.dueAmount, 0),
      vendorCount: vendors.length,
      billCount: totalBills.length,
    };
  },
});

import { useState, useMemo } from "react";
import { motion } from "motion/react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { TrendingUp, Wallet, Receipt, Users, BarChart3 } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { formatCurrency } from "../lib/utils";

type Period = "daily" | "weekly" | "monthly";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white border border-[#EDE0DB] rounded-xl px-3 py-2 shadow-lg">
        <p className="text-xs text-[#6B4C4F] font-medium">{label}</p>
        {payload.map((p: any) => (
          <p key={p.dataKey} className="text-sm font-bold" style={{ color: p.color }}>
            {formatCurrency(p.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function AnalyticsPage() {
  const vendors = useQuery(api.vendors.getVendors) ?? [];
  const transactions = useQuery(api.transactions.getTransactions) ?? [];
  const [period, setPeriod] = useState<Period>("weekly");

  const kpis = useMemo(() => {
    const bills = transactions.filter((t) => t.type === "bill");
    const payments = transactions.filter((t) => t.type === "payment");
    const totalRevenue = bills.reduce((s, t) => s + t.amount, 0);
    const totalProfit = bills.reduce((s, t) => s + t.profit, 0);
    const avgBill = bills.length > 0 ? totalRevenue / bills.length : 0;
    const totalDue = vendors.reduce((s, v) => s + v.dueAmount, 0);
    const collectionRate = totalRevenue > 0 ? ((totalRevenue - totalDue) / totalRevenue) * 100 : 0;
    return { totalRevenue, totalProfit, avgBill, totalDue, billCount: bills.length, collectionRate };
  }, [vendors, transactions]);

  const chartData = useMemo(() => {
    const n = period === "daily" ? 7 : period === "weekly" ? 8 : 6;
    const points: { label: string; revenue: number; payments: number }[] = [];

    for (let i = n - 1; i >= 0; i--) {
      const d = new Date();
      let label: string;
      let start: Date;
      let end: Date;

      if (period === "daily") {
        d.setDate(d.getDate() - i);
        label = i === 0 ? "Today" : d.toLocaleDateString("en-IN", { weekday: "short" });
        start = new Date(d); start.setHours(0, 0, 0, 0);
        end = new Date(d); end.setHours(23, 59, 59, 999);
      } else if (period === "weekly") {
        d.setDate(d.getDate() - i * 7);
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - d.getDay());
        label = `W${n - i}`;
        start = weekStart; end = new Date(weekStart); end.setDate(weekStart.getDate() + 6);
      } else {
        d.setMonth(d.getMonth() - i);
        label = d.toLocaleDateString("en-IN", { month: "short" });
        start = new Date(d.getFullYear(), d.getMonth(), 1);
        end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      }

      const revenue = transactions
        .filter((t) => { const dt = new Date(t.date); return t.type === "bill" && dt >= start && dt <= end; })
        .reduce((s, t) => s + t.amount, 0);
      const pmts = transactions
        .filter((t) => { const dt = new Date(t.date); return t.type === "payment" && dt >= start && dt <= end; })
        .reduce((s, t) => s + t.amount, 0);
      points.push({ label, revenue, payments: pmts });
    }
    return points;
  }, [transactions, period]);

  const topProducts = useMemo(() => {
    const freq: Record<string, { name: string; count: number; revenue: number }> = {};
    transactions.filter((t) => t.type === "bill").forEach((t) => {
      (t.items || []).forEach((item) => {
        if (!freq[item.name]) freq[item.name] = { name: item.name, count: 0, revenue: 0 };
        freq[item.name].count += item.qty;
        freq[item.name].revenue += item.qty * item.price;
      });
    });
    return Object.values(freq).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [transactions]);

  const topCustomers = useMemo(() => {
    const map: Record<string, { name: string; bills: number; revenue: number }> = {};
    transactions.filter((t) => t.type === "bill").forEach((t) => {
      if (!map[t.vendorId]) map[t.vendorId] = { name: t.vendorName, bills: 0, revenue: 0 };
      map[t.vendorId].bills++;
      map[t.vendorId].revenue += t.amount;
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [transactions]);

  const pieData = useMemo(() => {
    const totalRevenue = kpis.totalRevenue;
    const collected = totalRevenue - kpis.totalDue;
    return [
      { name: "Collected", value: Math.max(0, collected), color: "#16A34A" },
      { name: "Outstanding", value: kpis.totalDue, color: "#8B1E24" },
    ];
  }, [kpis]);

  const stagger = { container: { animate: { transition: { staggerChildren: 0.08 } } }, item: { initial: { y: 16, opacity: 0 }, animate: { y: 0, opacity: 1, transition: { duration: 0.35 } } } };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pb-6">
      <div className="px-5 pt-12 pb-5 bg-gradient-to-b from-[#FFF8F4] to-white border-b border-[#EDE0DB]">
        <h1 className="text-xl font-bold text-[#1A0A0C]">Analytics</h1>
        <p className="text-xs text-[#6B4C4F] mt-0.5">Business performance overview</p>
      </div>

      <motion.div variants={stagger.container} initial="initial" animate="animate" className="px-5 mt-5 grid grid-cols-2 gap-3">
        {[
          { label: "Total Revenue", value: formatCurrency(kpis.totalRevenue), icon: TrendingUp, accent: true },
          { label: "Total Profit", value: formatCurrency(kpis.totalProfit), icon: BarChart3 },
          { label: "Outstanding", value: formatCurrency(kpis.totalDue), icon: Wallet },
          { label: "Avg Bill", value: formatCurrency(kpis.avgBill), icon: Receipt },
        ].map((kpi) => (
          <motion.div key={kpi.label} variants={stagger.item}>
            <div className={`rounded-2xl p-4 ${kpi.accent ? "bg-[#8B1E24] text-white" : "bg-white border border-[#EDE0DB]"} shadow-sm`}>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-3 ${kpi.accent ? "bg-white/15" : "bg-[#FFF8F4]"}`}>
                <kpi.icon size={16} className={kpi.accent ? "text-white" : "text-[#8B1E24]"} />
              </div>
              <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${kpi.accent ? "text-white/70" : "text-[#6B4C4F]"}`}>{kpi.label}</p>
              <p className={`text-lg font-bold leading-tight ${kpi.accent ? "text-white" : "text-[#1A0A0C]"}`}>{kpi.value}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.35, duration: 0.4 }}
        className="mx-5 mt-5 bg-white border border-[#EDE0DB] rounded-2xl shadow-sm overflow-hidden"
      >
        <div className="px-4 pt-4 pb-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#6B4C4F]">Revenue vs Collections</p>
          <p className="text-base font-bold text-[#1A0A0C] mt-0.5">
            {period === "daily" ? "Last 7 Days" : period === "weekly" ? "Last 8 Weeks" : "Last 6 Months"}
          </p>
        </div>
        <div className="h-48 px-2 pb-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#EDE0DB" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#6B4C4F", fontWeight: 600 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: "#6B4C4F" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="revenue" fill="#8B1E24" radius={[4, 4, 0, 0]} name="Revenue" />
              <Bar dataKey="payments" fill="#C99A4B" radius={[4, 4, 0, 0]} name="Collected" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex gap-4 px-4 pb-3">
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-[#8B1E24]" /><span className="text-xs text-[#6B4C4F]">Revenue</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-[#C99A4B]" /><span className="text-xs text-[#6B4C4F]">Collected</span></div>
        </div>
        <div className="flex gap-2 px-4 pb-4">
          {(["daily", "weekly", "monthly"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-colors capitalize ${period === p ? "bg-[#8B1E24] text-white border-[#8B1E24]" : "bg-white text-[#6B4C4F] border-[#EDE0DB]"}`}
            >
              {p}
            </button>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.42, duration: 0.4 }}
        className="mx-5 mt-5 bg-white border border-[#EDE0DB] rounded-2xl shadow-sm p-4"
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#6B4C4F]">Collection Rate</p>
            <p className="text-2xl font-bold text-[#1A0A0C] mt-0.5">{kpis.collectionRate.toFixed(0)}%</p>
          </div>
          <div className="w-24 h-24">
            <PieChart width={96} height={96}>
              <Pie data={pieData} cx={40} cy={40} innerRadius={28} outerRadius={44} startAngle={90} endAngle={450} dataKey="value" strokeWidth={0}>
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </div>
        </div>
        <div className="flex gap-4">
          {pieData.map((d) => (
            <div key={d.name} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
              <span className="text-xs text-[#6B4C4F]">{d.name}: {formatCurrency(d.value)}</span>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        className="mx-5 mt-5"
      >
        <p className="text-xs font-semibold uppercase tracking-wider text-[#6B4C4F] mb-3">Top Products</p>
        <div className="bg-white border border-[#EDE0DB] rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center px-4 py-2.5 bg-[#F9F6F2] border-b border-[#EDE0DB]">
            <p className="flex-1 text-xs font-bold text-[#6B4C4F] uppercase tracking-wide">#  Product</p>
            <p className="w-16 text-xs font-bold text-[#6B4C4F] text-right">Units</p>
            <p className="w-24 text-xs font-bold text-[#6B4C4F] text-right">Revenue</p>
          </div>
          {topProducts.length === 0 ? (
            <div className="py-6 text-center text-sm text-[#6B4C4F]">No data yet</div>
          ) : (
            topProducts.map((p, i) => (
              <div key={p.name} className={`flex items-center px-4 py-3.5 ${i < topProducts.length - 1 ? "border-b border-[#EDE0DB]" : ""}`}>
                <div className="flex-1 flex items-center gap-2.5">
                  <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${i === 0 ? "bg-[#C99A4B] text-white" : "bg-[#F9F6F2] text-[#6B4C4F]"}`}>{i + 1}</span>
                  <p className="text-sm font-semibold text-[#1A0A0C]">{p.name}</p>
                </div>
                <p className="w-16 text-xs text-[#6B4C4F] text-right">{p.count.toFixed(0)}</p>
                <p className="w-24 text-sm font-bold text-[#8B1E24] text-right">{formatCurrency(p.revenue)}</p>
              </div>
            ))
          )}
        </div>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.57, duration: 0.4 }}
        className="mx-5 mt-5"
      >
        <p className="text-xs font-semibold uppercase tracking-wider text-[#6B4C4F] mb-3">Top Customers</p>
        <div className="bg-white border border-[#EDE0DB] rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center px-4 py-2.5 bg-[#F9F6F2] border-b border-[#EDE0DB]">
            <p className="flex-1 text-xs font-bold text-[#6B4C4F] uppercase tracking-wide">#  Customer</p>
            <p className="w-12 text-xs font-bold text-[#6B4C4F] text-right">Bills</p>
            <p className="w-24 text-xs font-bold text-[#6B4C4F] text-right">Revenue</p>
          </div>
          {topCustomers.length === 0 ? (
            <div className="py-6 text-center text-sm text-[#6B4C4F]">No data yet</div>
          ) : (
            topCustomers.map((c, i) => (
              <div key={c.name} className={`flex items-center px-4 py-3.5 ${i < topCustomers.length - 1 ? "border-b border-[#EDE0DB]" : ""}`}>
                <div className="flex-1 flex items-center gap-2.5">
                  <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${i === 0 ? "bg-[#8B1E24] text-white" : "bg-[#F9F6F2] text-[#6B4C4F]"}`}>{i + 1}</span>
                  <p className="text-sm font-semibold text-[#1A0A0C]">{c.name}</p>
                </div>
                <p className="w-12 text-xs text-[#6B4C4F] text-right">{c.bills}</p>
                <p className="w-24 text-sm font-bold text-[#8B1E24] text-right">{formatCurrency(c.revenue)}</p>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { Search, Plus, ChevronDown, ChevronRight, X } from "lucide-react";
import { useStore, formatCurrency, formatShortDate } from "../data/store";

export default function BillHistoryPage() {
  const navigate = useNavigate();
  const { state } = useStore();
  const [search, setSearch] = useState("");
  const [customerId, setCustomerId] = useState("all");
  const [openMonths, setOpenMonths] = useState<Set<string>>(new Set());

  // All transactions (bills + payments) filtered
  const allTxs = useMemo(() => {
    return state.transactions
      .filter((t) => {
        if (customerId !== "all" && t.vendorId !== customerId) return false;
        if (search && !t.vendorName.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [state.transactions, search, customerId]);

  // Top-level totals
  const totals = useMemo(() => {
    const bills = allTxs.filter((t) => t.type === "bill");
    const payments = allTxs.filter((t) => t.type === "payment");
    return {
      bills: bills.reduce((s, t) => s + t.amount, 0),
      payments: payments.reduce((s, t) => s + t.amount, 0),
      profit: bills.reduce((s, t) => s + (t.profit || 0), 0),
      count: allTxs.length,
    };
  }, [allTxs]);

  // Group by month key "YYYY-MM"
  const monthGroups = useMemo(() => {
    const map: Record<string, typeof allTxs> = {};
    allTxs.forEach((t) => {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!map[key]) map[key] = [];
      map[key].push(t);
    });
    return Object.entries(map)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([key, txs]) => {
        const [year, month] = key.split("-");
        const label = new Date(Number(year), Number(month) - 1, 1)
          .toLocaleDateString("en-IN", { month: "long", year: "numeric" });
        const bills = txs.filter((t) => t.type === "bill");
        const payments = txs.filter((t) => t.type === "payment");
        const billTotal = bills.reduce((s, t) => s + t.amount, 0);
        const paymentTotal = payments.reduce((s, t) => s + t.amount, 0);
        const profit = bills.reduce((s, t) => s + (t.profit || 0), 0);
        const balance = billTotal - paymentTotal;
        return { key, label, txs, billTotal, paymentTotal, profit, balance };
      });
  }, [allTxs]);

  const toggleMonth = (key: string) => {
    setOpenMonths((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pb-24">
      {/* Header */}
      <div className="px-5 pt-12 pb-4 bg-white sticky top-0 z-10 border-b border-[#EDE0DB]">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-[#1A0A0C]">Bills</h1>
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => navigate("/bills/new")}
            className="w-9 h-9 rounded-xl bg-[#8B1E24] flex items-center justify-center shadow-sm"
          >
            <Plus size={18} className="text-white" />
          </motion.button>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 bg-[#F9F6F2] rounded-xl px-3.5 py-2.5 border border-[#EDE0DB]">
          <Search size={15} className="text-[#6B4C4F] flex-shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-[#6B4C4F]/50"
          />
          {search && <button onClick={() => setSearch("")}><X size={14} className="text-[#6B4C4F]" /></button>}
        </div>

        {/* Customer filter chips */}
        <div className="flex gap-2 mt-2.5 overflow-x-auto pb-0.5 no-scrollbar">
          <button
            onClick={() => setCustomerId("all")}
            className={`flex-shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${customerId === "all" ? "bg-[#8B1E24] text-white" : "bg-[#F9F6F2] text-[#6B4C4F] border border-[#EDE0DB]"}`}
          >
            All
          </button>
          {state.vendors.map((v) => (
            <button
              key={v._id}
              onClick={() => setCustomerId(v._id === customerId ? "all" : v._id)}
              className={`flex-shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${customerId === v._id ? "bg-[#8B1E24] text-white" : "bg-[#F9F6F2] text-[#6B4C4F] border border-[#EDE0DB]"}`}
            >
              {v.name}
            </button>
          ))}
        </div>
      </div>

      {/* Total analytics */}
      <div className="px-5 pt-4 pb-2 grid grid-cols-3 gap-2.5">
        <div className="bg-white border border-[#EDE0DB] rounded-xl p-3 shadow-sm">
          <p className="text-[10px] font-semibold text-[#6B4C4F] uppercase tracking-wide mb-1">Bills</p>
          <p className="text-sm font-bold text-[#8B1E24] leading-tight">+{formatCurrency(totals.bills)}</p>
        </div>
        <div className="bg-white border border-[#EDE0DB] rounded-xl p-3 shadow-sm">
          <p className="text-[10px] font-semibold text-[#6B4C4F] uppercase tracking-wide mb-1">Payments</p>
          <p className="text-sm font-bold text-[#16A34A] leading-tight">-{formatCurrency(totals.payments)}</p>
        </div>
        <div className="bg-white border border-[#EDE0DB] rounded-xl p-3 shadow-sm">
          <p className="text-[10px] font-semibold text-[#6B4C4F] uppercase tracking-wide mb-1">Profit</p>
          <p className="text-sm font-bold text-[#C99A4B] leading-tight">{formatCurrency(totals.profit)}</p>
        </div>
      </div>
      <div className="px-5 pb-3">
        <p className="text-xs text-[#6B4C4F]">{totals.count} transactions total</p>
      </div>

      {/* Month accordions */}
      {monthGroups.length === 0 ? (
        <div className="text-center py-16 px-5">
          <p className="text-sm font-semibold text-[#1A0A0C]">No transactions found</p>
          <button onClick={() => navigate("/bills/new")} className="mt-4 bg-[#8B1E24] text-white text-sm font-semibold px-5 py-2.5 rounded-xl">
            Create Bill
          </button>
        </div>
      ) : (
        <div className="px-5 space-y-3">
          {monthGroups.map((group) => {
            const isOpen = openMonths.has(group.key);
            return (
              <div key={group.key} className="bg-white border border-[#EDE0DB] rounded-2xl shadow-sm overflow-hidden">
                {/* Accordion header */}
                <button
                  onClick={() => toggleMonth(group.key)}
                  className="w-full flex items-center justify-between px-4 py-3.5 text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <motion.div animate={{ rotate: isOpen ? 0 : -90 }} transition={{ duration: 0.2 }}>
                      <ChevronDown size={16} className="text-[#6B4C4F]" />
                    </motion.div>
                    <div>
                      <p className="text-sm font-bold text-[#1A0A0C]">{group.label}</p>
                      <p className="text-xs text-[#6B4C4F]">{group.txs.length} transactions</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${group.balance >= 0 ? "text-[#8B1E24]" : "text-[#16A34A]"}`}>
                      {group.balance >= 0 ? "+" : ""}{formatCurrency(group.balance)}
                    </p>
                    <p className="text-[10px] text-[#6B4C4F]">Balance</p>
                  </div>
                </button>

                {/* Month summary row */}
                <div className="grid grid-cols-3 border-t border-[#EDE0DB] bg-[#F9F6F2]">
                  <div className="px-3 py-2.5 border-r border-[#EDE0DB]">
                    <p className="text-[10px] text-[#6B4C4F] mb-0.5">Bills</p>
                    <p className="text-xs font-bold text-[#8B1E24]">+{formatCurrency(group.billTotal)}</p>
                  </div>
                  <div className="px-3 py-2.5 border-r border-[#EDE0DB]">
                    <p className="text-[10px] text-[#6B4C4F] mb-0.5">Payments</p>
                    <p className="text-xs font-bold text-[#16A34A]">-{formatCurrency(group.paymentTotal)}</p>
                  </div>
                  <div className="px-3 py-2.5">
                    <p className="text-[10px] text-[#6B4C4F] mb-0.5">Profit</p>
                    <p className="text-xs font-bold text-[#C99A4B]">{formatCurrency(group.profit)}</p>
                  </div>
                </div>

                {/* Expanded transactions */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      {group.txs.map((t, i) => {
                        const vendor = state.vendors.find((v) => v._id === t.vendorId);
                        return (
                          <motion.button
                            key={t._id}
                            whileTap={{ scale: 0.98 }}
                            onClick={() =>
                              t.type === "bill"
                                ? navigate(`/bills/${t._id}`)
                                : navigate(`/payments/${t._id}`)
                            }
                            className={`w-full flex items-center gap-3 px-4 py-3 text-left border-t border-[#EDE0DB] ${i % 2 === 0 ? "bg-white" : "bg-[#FDFCFC]"}`}
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-[#1A0A0C] truncate">{t.vendorName}</p>
                              <p className="text-xs text-[#6B4C4F]">
                                {t.type === "bill" ? "Bill" : "Payment"} · {formatShortDate(t.date)}
                                {t.notes ? ` · ${t.notes}` : ""}
                              </p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className={`text-sm font-bold ${t.type === "bill" ? "text-[#8B1E24]" : "text-[#16A34A]"}`}>
                                {t.type === "bill" ? "+" : "-"}{formatCurrency(t.amount)}
                              </p>
                              {t.type === "bill" && vendor && (
                                <p className={`text-[10px] font-semibold ${vendor.dueAmount > 0 ? "text-[#C99A4B]" : "text-[#16A34A]"}`}>
                                  {vendor.dueAmount > 0 ? "Due" : "Settled"}
                                </p>
                              )}
                            </div>
                            <ChevronRight size={14} className="text-[#EDE0DB] flex-shrink-0" />
                          </motion.button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}

      {/* FAB */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
        whileTap={{ scale: 0.93 }}
        onClick={() => navigate("/bills/new")}
        className="fixed bottom-24 right-5 w-14 h-14 rounded-2xl bg-[#8B1E24] flex items-center justify-center z-30"
        style={{ boxShadow: "0 4px 24px rgba(139,30,36,0.35)" }}
      >
        <Plus size={24} className="text-white" />
      </motion.button>
    </motion.div>
  );
}

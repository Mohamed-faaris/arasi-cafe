import { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router";
import { motion } from "motion/react";
import { Search, CreditCard, ChevronRight, X, Filter, ArrowLeft } from "lucide-react";
import { useStore, formatCurrency, formatShortDate } from "../data/store";

export default function PaymentHistoryPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { state } = useStore();
  const [search, setSearch] = useState("");
  const [customerId, setCustomerId] = useState(id || "all");
  const [showFilter, setShowFilter] = useState(false);

  const payments = useMemo(() => {
    return state.transactions
      .filter((t) => t.type === "payment")
      .filter((t) => {
        if (customerId !== "all" && t.vendorId !== customerId) return false;
        if (search && !t.vendorName.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [state.transactions, search, customerId]);

  const totalPaid = useMemo(() => payments.reduce((s, t) => s + t.amount, 0), [payments]);
  const isDetail = Boolean(id);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pb-6">
      {/* Header */}
      <div className="px-5 pt-12 pb-4 bg-white sticky top-0 z-10 border-b border-[#EDE0DB]">
        <div className="flex items-center gap-3 mb-4">
          {isDetail && (
            <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-white border border-[#EDE0DB] flex items-center justify-center shadow-sm">
              <ArrowLeft size={18} className="text-[#1A0A0C]" />
            </button>
          )}
          <div className="flex-1">
            <h1 className="text-xl font-bold text-[#1A0A0C]">Payments</h1>
            <p className="text-xs text-[#6B4C4F] mt-0.5">{payments.length} payments · {formatCurrency(totalPaid)}</p>
          </div>
        </div>

        {/* Search + filter */}
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 bg-[#F9F6F2] rounded-xl px-3.5 py-2.5 border border-[#EDE0DB]">
            <Search size={15} className="text-[#6B4C4F]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search payments..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-[#6B4C4F]/50"
            />
            {search && <button onClick={() => setSearch("")}><X size={14} className="text-[#6B4C4F]" /></button>}
          </div>
          {!isDetail && (
            <button
              onClick={() => setShowFilter(!showFilter)}
              className={`w-10 h-10 rounded-xl flex items-center justify-center border ${customerId !== "all" ? "bg-[#8B1E24] border-[#8B1E24]" : "bg-[#F9F6F2] border-[#EDE0DB]"}`}
            >
              <Filter size={15} className={customerId !== "all" ? "text-white" : "text-[#6B4C4F]"} />
            </button>
          )}
        </div>

        {showFilter && !isDetail && (
          <div className="mt-2 flex gap-2 flex-wrap">
            <button
              onClick={() => setCustomerId("all")}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${customerId === "all" ? "bg-[#8B1E24] text-white" : "bg-[#F9F6F2] text-[#6B4C4F] border border-[#EDE0DB]"}`}
            >
              All
            </button>
            {state.vendors.map((v) => (
              <button
                key={v._id}
                onClick={() => setCustomerId(v._id)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${customerId === v._id ? "bg-[#8B1E24] text-white" : "bg-[#F9F6F2] text-[#6B4C4F] border border-[#EDE0DB]"}`}
              >
                {v.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Payment list */}
      <div className="px-5 pt-4 space-y-2.5">
        {payments.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-[#F0FDF4] border border-green-100 flex items-center justify-center mx-auto mb-3">
              <CreditCard size={24} className="text-[#16A34A]" />
            </div>
            <p className="text-sm font-semibold text-[#1A0A0C]">No payments found</p>
            <p className="text-xs text-[#6B4C4F] mt-1">Payments will appear here</p>
          </div>
        ) : (
          payments.map((t, i) => (
            <motion.button
              key={t._id}
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.04 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(`/receipts/${t._id}`)}
              className="w-full flex items-center gap-3.5 bg-white border border-[#EDE0DB] rounded-2xl shadow-sm px-4 py-3.5 text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-[#F0FDF4] flex items-center justify-center flex-shrink-0">
                <CreditCard size={18} className="text-[#16A34A]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[#1A0A0C]">{t.vendorName}</p>
                <p className="text-xs text-[#6B4C4F] mt-0.5">{formatShortDate(t.date)} · {t.paymentMethod || "Cash"}</p>
                {t.notes && <p className="text-xs text-[#6B4C4F] truncate mt-0.5">{t.notes}</p>}
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-bold text-[#16A34A]">{formatCurrency(t.amount)}</p>
                <p className="text-xs text-[#6B4C4F] mt-0.5">{t.paymentMethod || "Cash"}</p>
              </div>
              <ChevronRight size={15} className="text-[#EDE0DB] flex-shrink-0 ml-1" />
            </motion.button>
          ))
        )}
      </div>
    </motion.div>
  );
}

import { useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { Search, Plus, Phone, Truck } from "lucide-react";
import { useStore, formatCurrency, getInitials } from "../data/store";

export default function SuppliersPage() {
  const navigate = useNavigate();
  const { state } = useStore();
  const [search, setSearch] = useState("");

  const filtered = state.suppliers.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.phone.includes(search)
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pb-6">
      {/* Header */}
      <div className="px-5 pt-12 pb-4 bg-gradient-to-b from-[#FFF8F4] to-white border-b border-[#EDE0DB]">
        <h1 className="text-xl font-bold text-[#1A0A0C]">Suppliers</h1>
        <p className="text-xs text-[#6B4C4F] mt-0.5">Track what you owe your suppliers</p>
        <div className="relative mt-4">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B4C4F]/60" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search suppliers…"
            className="w-full pl-9 pr-4 py-2.5 bg-[#F9F6F2] border border-[#EDE0DB] rounded-xl text-sm text-[#1A0A0C] placeholder-[#6B4C4F]/50 outline-none focus:border-[#8B1E24] transition-colors"
          />
        </div>
      </div>

      {/* Summary bar */}
      {state.suppliers.some((s) => s.balanceDue > 0) && (
        <div className="mx-5 mt-4 bg-[#FFF8F4] border border-[#EDE0DB] rounded-xl px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-[#6B4C4F] font-medium">Total You Owe</p>
            <p className="text-lg font-bold text-[#8B1E24]">
              {formatCurrency(state.suppliers.reduce((s, sup) => s + sup.balanceDue, 0))}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#8B1E24]/10 flex items-center justify-center">
            <Truck size={18} className="text-[#8B1E24]" />
          </div>
        </div>
      )}

      {/* List */}
      <div className="px-5 mt-4 space-y-2">
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
              <div className="w-14 h-14 rounded-2xl bg-[#FFF8F4] border border-[#EDE0DB] flex items-center justify-center mx-auto mb-3">
                <Truck size={22} className="text-[#6B4C4F]/40" />
              </div>
              <p className="text-sm font-semibold text-[#1A0A0C]">No suppliers yet</p>
              <button
                onClick={() => navigate("/suppliers/new")}
                className="mt-3 text-xs font-semibold text-[#8B1E24]"
              >
                Add your first supplier
              </button>
            </motion.div>
          ) : (
            filtered.map((s, i) => (
              <motion.button
                key={s._id}
                layout
                initial={{ y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ delay: i * 0.04 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(`/suppliers/${s._id}`)}
                className="w-full bg-white border border-[#EDE0DB] rounded-xl flex items-center gap-3 px-4 py-3 text-left shadow-sm"
              >
                {/* Avatar */}
                <div className="w-11 h-11 rounded-xl bg-[#8B1E24]/10 border border-[#8B1E24]/15 flex items-center justify-center font-bold text-[#8B1E24] text-sm flex-shrink-0">
                  {s.avatar}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#1A0A0C] truncate">{s.name}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Phone size={11} className="text-[#6B4C4F]/60" />
                    <p className="text-xs text-[#6B4C4F]">{s.phone}</p>
                  </div>
                </div>

                {/* Balance */}
                <div className="text-right flex-shrink-0">
                  {s.balanceDue > 0 ? (
                    <>
                      <p className="text-sm font-bold text-[#8B1E24]">{formatCurrency(s.balanceDue)}</p>
                      <p className="text-xs text-[#8B1E24]/70 font-medium">you owe</p>
                    </>
                  ) : (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#F0FDF4] text-[#16A34A] border border-[#16A34A]/20">
                      Settled
                    </span>
                  )}
                </div>
              </motion.button>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* FAB */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 300, damping: 20 }}
        whileTap={{ scale: 0.93 }}
        onClick={() => navigate("/suppliers/new")}
        className="fixed bottom-20 right-5 w-14 h-14 rounded-2xl bg-[#8B1E24] shadow-lg flex items-center justify-center z-30"
        style={{ boxShadow: "0 4px 24px rgba(139,30,36,0.35)" }}
      >
        <Plus size={24} className="text-white" />
      </motion.button>
    </motion.div>
  );
}

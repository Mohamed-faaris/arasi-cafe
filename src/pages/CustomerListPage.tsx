import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { Search, Plus, Phone, MessageCircle, ChevronRight, SlidersHorizontal, X } from "lucide-react";
import { useStore, formatCurrency, formatShortDate } from "../data/store";

type Filter = "all" | "due" | "paid";
type Sort = "name" | "due" | "recent";

export default function CustomerListPage() {
  const navigate = useNavigate();
  const { state } = useStore();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("due");
  const [showSort, setShowSort] = useState(false);

  const filtered = useMemo(() => {
    let list = [...state.vendors];
    if (search) list = list.filter((v) => v.name.toLowerCase().includes(search.toLowerCase()) || v.phone.includes(search));
    if (filter === "due") list = list.filter((v) => v.dueAmount > 0);
    if (filter === "paid") list = list.filter((v) => v.dueAmount === 0);
    if (sort === "name") list.sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === "due") list.sort((a, b) => b.dueAmount - a.dueAmount);
    else if (sort === "recent") list.sort((a, b) => new Date(b.lastTransaction).getTime() - new Date(a.lastTransaction).getTime());
    return list;
  }, [state.vendors, search, filter, sort]);

  const totalDue = useMemo(() => state.vendors.reduce((s, v) => s + v.dueAmount, 0), [state.vendors]);

  const sortLabels: Record<Sort, string> = { name: "Name", due: "Due Amount", recent: "Last Active" };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pb-6 relative">
      {/* Header */}
      <div className="px-5 pt-12 pb-4 bg-white sticky top-0 z-10 border-b border-[#EDE0DB]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-[#1A0A0C]">Customers</h1>
            <p className="text-xs text-[#6B4C4F] mt-0.5">{state.vendors.length} customers · {formatCurrency(totalDue)} total due</p>
          </div>
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => navigate("/customers/new")}
            className="w-9 h-9 rounded-xl bg-[#8B1E24] flex items-center justify-center shadow-sm"
          >
            <Plus size={18} className="text-white" />
          </motion.button>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 bg-[#F9F6F2] rounded-xl px-3.5 py-2.5 border border-[#EDE0DB]">
          <Search size={16} className="text-[#6B4C4F] flex-shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or phone..."
            className="flex-1 bg-transparent text-sm text-[#1A0A0C] placeholder:text-[#6B4C4F]/60 outline-none"
          />
          {search && (
            <button onClick={() => setSearch("")}>
              <X size={15} className="text-[#6B4C4F]" />
            </button>
          )}
        </div>

        {/* Filter chips + sort */}
        <div className="flex items-center gap-2 mt-3">
          {(["all", "due", "paid"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${filter === f ? "bg-[#8B1E24] text-white" : "bg-[#F9F6F2] text-[#6B4C4F] border border-[#EDE0DB]"}`}
            >
              {f === "all" ? "All" : f === "due" ? "Has Due" : "Paid Up"}
            </button>
          ))}
          <div className="flex-1" />
          <button
            onClick={() => setShowSort(!showSort)}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 bg-[#F9F6F2] border border-[#EDE0DB]"
          >
            <SlidersHorizontal size={12} className="text-[#6B4C4F]" />
            <span className="text-xs font-semibold text-[#6B4C4F]">{sortLabels[sort]}</span>
          </button>
        </div>

        {/* Sort dropdown */}
        <AnimatePresence>
          {showSort && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="absolute right-5 top-full mt-1 bg-white border border-[#EDE0DB] rounded-xl shadow-lg z-20 overflow-hidden"
            >
              {(["name", "due", "recent"] as Sort[]).map((s) => (
                <button
                  key={s}
                  onClick={() => { setSort(s); setShowSort(false); }}
                  className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors hover:bg-[#FFF8F4] ${sort === s ? "text-[#8B1E24] font-semibold" : "text-[#1A0A0C]"}`}
                >
                  {sortLabels[s]}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* List */}
      <div className="px-5 pt-4 space-y-2.5">
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-[#FFF8F4] border border-[#EDE0DB] flex items-center justify-center mx-auto mb-3">
                <Search size={24} className="text-[#6B4C4F]" />
              </div>
              <p className="text-sm font-semibold text-[#1A0A0C]">No customers found</p>
              <p className="text-xs text-[#6B4C4F] mt-1">Try adjusting your search or filters</p>
            </motion.div>
          ) : (
            filtered.map((v, i) => (
              <motion.div
                key={v._id}
                layout
                initial={{ y: 16, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.04, duration: 0.3 }}
              >
                <div className="bg-white border border-[#EDE0DB] rounded-2xl shadow-sm overflow-hidden">
                  <button
                    onClick={() => navigate(`/customers/${v._id}`)}
                    className="w-full flex items-center gap-3.5 px-4 pt-4 pb-3"
                  >
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 rounded-xl bg-[#FFF8F4] border border-[#EDE0DB] flex items-center justify-center font-bold text-[#8B1E24] text-sm">
                        {v.avatar}
                      </div>
                      {v.daysOverdue >= 7 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white" />
                      )}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-bold text-[#1A0A0C] truncate">{v.name}</p>
                      <p className="text-xs text-[#6B4C4F] mt-0.5">{v.phone}</p>
                      <p className="text-xs text-[#6B4C4F] mt-0.5">{formatShortDate(v.lastTransaction)}</p>
                    </div>
                    {/* Due amount */}
                    <div className="text-right flex-shrink-0">
                      {v.dueAmount > 0 ? (
                        <>
                          <p className="text-sm font-bold text-[#8B1E24]">{formatCurrency(v.dueAmount)}</p>
                          <span className={`mt-1 inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${v.daysOverdue >= 30 ? "bg-red-50 text-red-600" : v.daysOverdue >= 7 ? "bg-orange-50 text-orange-600" : "bg-[#FFF8F4] text-[#C99A4B]"}`}>
                            {v.daysOverdue > 0 ? `${v.daysOverdue}d due` : "Due"}
                          </span>
                        </>
                      ) : (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-600">Paid</span>
                      )}
                    </div>
                    <ChevronRight size={16} className="text-[#EDE0DB] flex-shrink-0 ml-1" />
                  </button>
                  {/* Quick actions */}
                  <div className="border-t border-[#EDE0DB] flex">
                    <a
                      href={`tel:${v.phone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-[#6B4C4F] hover:bg-[#FFF8F4] transition-colors"
                    >
                      <Phone size={13} /> Call
                    </a>
                    <div className="w-px bg-[#EDE0DB]" />
                    <a
                      href={`https://wa.me/91${v.phone}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-[#16A34A] hover:bg-green-50 transition-colors"
                    >
                      <MessageCircle size={13} /> WhatsApp
                    </a>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* FAB */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.3 }}
        whileTap={{ scale: 0.93 }}
        onClick={() => navigate("/customers/new")}
        className="fixed bottom-24 right-5 w-14 h-14 rounded-full bg-[#8B1E24] flex items-center justify-center shadow-xl shadow-[#8B1E24]/30 z-30"
      >
        <Plus size={24} className="text-white" />
      </motion.button>
    </motion.div>
  );
}

import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { Search, Plus, Package, X, Edit3, Trash2 } from "lucide-react";
import { useStore, formatCurrency } from "../data/store";
import { toast } from "sonner";

type Cat = "all" | "A" | "B";

export default function ProductListPage() {
  const navigate = useNavigate();
  const { state, dispatch } = useStore();
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState<Cat>("all");

  const filtered = useMemo(() => {
    let list = [...state.products];
    if (search) list = list.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
    if (cat !== "all") list = list.filter((p) => p.type === cat);
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [state.products, search, cat]);

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Delete "${name}"?`)) {
      dispatch({ type: "DELETE_PRODUCT", id });
      toast.error("Product deleted");
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pb-6 relative">
      {/* Header */}
      <div className="px-5 pt-12 pb-4 bg-white sticky top-0 z-10 border-b border-[#EDE0DB]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-[#1A0A0C]">Products</h1>
            <p className="text-xs text-[#6B4C4F] mt-0.5">{state.products.length} products in catalog</p>
          </div>
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => navigate("/products/new")}
            className="w-9 h-9 rounded-xl bg-[#8B1E24] flex items-center justify-center shadow-sm"
          >
            <Plus size={18} className="text-white" />
          </motion.button>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 bg-[#F9F6F2] rounded-xl px-3.5 py-2.5 border border-[#EDE0DB] mb-3">
          <Search size={15} className="text-[#6B4C4F]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-[#6B4C4F]/50"
          />
          {search && <button onClick={() => setSearch("")}><X size={14} className="text-[#6B4C4F]" /></button>}
        </div>

        {/* Category chips */}
        
      </div>

      {/* Product cards */}
      <div className="px-5 pt-4 space-y-2">
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
              <p className="text-sm font-semibold text-[#1A0A0C]">No products found</p>
              <button onClick={() => navigate("/products/new")} className="mt-3 text-xs font-semibold text-[#8B1E24]">
                Add your first product
              </button>
            </motion.div>
          ) : (
            filtered.map((p, i) => (
              <motion.div
                key={p._id}
                layout
                initial={{ y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.04 }}
                className="bg-white border border-[#EDE0DB] rounded-xl flex items-center px-4 py-3 gap-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#1A0A0C] truncate">{p.name}</p>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    <span className="text-xs text-[#6B4C4F]">Sell <span className="font-bold text-[#8B1E24]">{formatCurrency(p.defaultPrice)}</span></span>
                    <span className="text-xs text-[#6B4C4F]">Buy <span className="font-medium">{formatCurrency(p.purchasePrice)}</span></span>
                    {p.uom && <span className="text-xs text-[#6B4C4F]">/{p.uom}</span>}
                    {(p.cgst + p.sgst) > 0 && <span className="text-xs text-[#6B4C4F]">GST {p.cgst + p.sgst}%</span>}
                  </div>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => navigate(`/products/${p._id}/edit`)}
                    className="px-3 py-1.5 rounded-lg bg-[#F9F6F2] border border-[#EDE0DB] text-xs font-semibold text-[#6B4C4F]"
                  >Edit</button>
                  <button
                    onClick={() => handleDelete(p._id, p.name)}
                    className="px-3 py-1.5 rounded-lg bg-red-50 border border-red-100 text-xs font-semibold text-red-500"
                  >
                    Delete
                  </button>
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
        transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
        whileTap={{ scale: 0.93 }}
        onClick={() => navigate("/products/new")}
        className="fixed bottom-24 right-5 w-14 h-14 rounded-full bg-[#8B1E24] flex items-center justify-center shadow-xl shadow-[#8B1E24]/30 z-30"
      >
        <Plus size={24} className="text-white" />
      </motion.button>
    </motion.div>
  );
}

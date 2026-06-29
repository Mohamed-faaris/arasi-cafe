import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft, Plus, CreditCard, Phone, MessageCircle, Receipt, ChevronRight,
} from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { formatCurrency, formatDate, formatShortDate } from "../lib/utils";
import { toast } from "sonner";
import type { Id } from "../convex/_generated/dataModel";

type ModalType = "bill" | "payment" | null;

export default function SupplierDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const suppliers = useQuery(api.suppliers.getSuppliers) ?? [];
  const supplierTxs = useQuery(api.suppliers.getSupplierTransactions, { supplierId: id as Id<"suppliers"> }) ?? [];
  const createSupplierTransaction = useMutation(api.suppliers.createSupplierTransaction);
  const [modal, setModal] = useState<ModalType>(null);
  const [tab, setTab] = useState<"all" | "purchases" | "payments">("all");

  const supplier = useMemo(() => suppliers.find((s) => s._id === id), [suppliers, id]);
  const txs = useMemo(() =>
    [...supplierTxs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [supplierTxs]
  );

  const filtered = useMemo(() => {
    if (tab === "purchases") return txs.filter((t) => t.type === "purchase");
    if (tab === "payments") return txs.filter((t) => t.type === "payment");
    return txs;
  }, [txs, tab]);

  const purchases = txs.filter((t) => t.type === "purchase");
  const payments = txs.filter((t) => t.type === "payment");

  if (!supplier) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <p className="text-[#6B4C4F]">Supplier not found</p>
        <button onClick={() => navigate("/suppliers")} className="text-[#8B1E24] font-semibold">Go back</button>
      </div>
    );
  }

  return (
    <>
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="pb-36">
        <div className="bg-gradient-to-b from-[#FFF8F4] to-white px-5 pt-12 pb-5">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-white border border-[#EDE0DB] flex items-center justify-center shadow-sm mb-5">
            <ArrowLeft size={18} className="text-[#1A0A0C]" />
          </button>

          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-[#8B1E24]/10 border border-[#8B1E24]/20 flex items-center justify-center font-bold text-[#8B1E24] text-xl">
              {supplier.avatar}
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-[#1A0A0C]">{supplier.name}</h1>
              <div className="flex items-center gap-1.5 mt-1">
                <Phone size={12} className="text-[#6B4C4F]" />
                <p className="text-sm text-[#6B4C4F]">{supplier.phone}</p>
              </div>
              {supplier.address && <p className="text-xs text-[#6B4C4F] mt-0.5 truncate">{supplier.address}</p>}
            </div>
          </div>

          <div className={`rounded-2xl px-4 py-4 ${supplier.balanceDue > 0 ? "bg-[#8B1E24]" : "bg-[#16A34A]"}`}>
            <p className="text-xs font-semibold text-white/70 uppercase tracking-wider">You Owe</p>
            <p className="text-3xl font-bold text-white mt-1">{formatCurrency(supplier.balanceDue)}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-3">
            <div className="bg-white border border-[#EDE0DB] rounded-xl p-3 shadow-sm">
              <p className="text-xs text-[#6B4C4F] font-medium">Total Purchased</p>
              <p className="text-base font-bold text-[#1A0A0C] mt-0.5">{formatCurrency(supplier.totalPurchases)}</p>
            </div>
            <div className="bg-white border border-[#EDE0DB] rounded-xl p-3 shadow-sm">
              <p className="text-xs text-[#6B4C4F] font-medium">Total Paid</p>
              <p className="text-base font-bold text-[#16A34A] mt-0.5">{formatCurrency(supplier.totalPaid)}</p>
            </div>
          </div>

          <div className="flex gap-2.5 mt-3">
            <a href={`tel:${supplier.phone}`} className="flex-1 flex items-center justify-center gap-1.5 bg-white border border-[#EDE0DB] rounded-xl py-2.5 text-xs font-semibold text-[#6B4C4F] shadow-sm">
              <Phone size={13} /> Call
            </a>
            <a href={`https://wa.me/91${supplier.phone}`} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-1.5 bg-white border border-[#EDE0DB] rounded-xl py-2.5 text-xs font-semibold text-[#16A34A] shadow-sm">
              <MessageCircle size={13} /> WhatsApp
            </a>
          </div>
        </div>

        <div className="px-5 mt-5">
          <div className="flex gap-2 mb-4">
            {(["all", "purchases", "payments"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors capitalize ${tab === t ? "bg-[#8B1E24] text-white" : "bg-[#F9F6F2] text-[#6B4C4F] border border-[#EDE0DB]"}`}
              >
                {t === "all" ? "All" : t === "purchases" ? `Bills (${purchases.length})` : `Payments (${payments.length})`}
              </button>
            ))}
          </div>

          <AnimatePresence mode="popLayout">
            {filtered.length === 0 ? (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
                <p className="text-sm text-[#6B4C4F]">No transactions yet</p>
              </motion.div>
            ) : (
              <div className="bg-white border border-[#EDE0DB] rounded-2xl shadow-sm overflow-hidden">
                {filtered.map((t, i) => (
                  <motion.div
                    key={t._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.04 }}
                    className={`flex items-center gap-3 px-4 py-3.5 ${i < filtered.length - 1 ? "border-b border-[#EDE0DB]" : ""}`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${t.type === "purchase" ? "bg-[#FFF8F4]" : "bg-[#F0FDF4]"}`}>
                      {t.type === "purchase"
                        ? <Receipt size={16} className="text-[#8B1E24]" />
                        : <CreditCard size={16} className="text-[#16A34A]" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#1A0A0C]">
                        {t.type === "purchase" ? "Purchase" : "Payment"}
                      </p>
                      <p className="text-xs text-[#6B4C4F]">
                        {formatShortDate(t.date)}{t.notes ? ` · ${t.notes}` : ""}{t.paymentMethod ? ` · ${t.paymentMethod}` : ""}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-sm font-bold ${t.type === "purchase" ? "text-[#8B1E24]" : "text-[#16A34A]"}`}>
                        {t.type === "purchase" ? "+" : "-"}{formatCurrency(t.amount)}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <div className="fixed bottom-16 left-0 right-0 px-5 pb-3 pt-2 bg-white/90 backdrop-blur border-t border-[#EDE0DB]">
        <div className="flex gap-2.5">
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => setModal("bill")}
            className="flex-1 flex items-center justify-center gap-2 bg-[#8B1E24] text-white rounded-xl py-3 text-sm font-semibold shadow-sm"
          >
            <Plus size={16} /> Add Bill
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => setModal("payment")}
            className="flex-1 flex items-center justify-center gap-2 bg-white border border-[#EDE0DB] text-[#1A0A0C] rounded-xl py-3 text-sm font-semibold shadow-sm"
          >
            <CreditCard size={16} className="text-[#C99A4B]" /> Pay Supplier
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {modal && (
          <SupplierModal
            type={modal}
            supplier={supplier}
            onClose={() => setModal(null)}
            onSave={async (amount, notes, paymentMethod) => {
              await createSupplierTransaction({
                type: modal === "bill" ? "purchase" : "payment",
                supplierId: supplier._id,
                supplierName: supplier.name,
                amount,
                date: new Date().toISOString(),
                notes: notes || undefined,
                paymentMethod: modal === "payment" ? paymentMethod : undefined,
              });
              toast.success(modal === "bill" ? "Bill recorded" : "Payment recorded");
              setModal(null);
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function SupplierModal({ type, supplier, onClose, onSave }: {
  type: "bill" | "payment";
  supplier: { name: string; balanceDue: number };
  onClose: () => void;
  onSave: (amount: number, notes: string, paymentMethod: string) => void;
}) {
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [method, setMethod] = useState("Cash");

  const handleSave = () => {
    const num = parseFloat(amount);
    if (!num || num <= 0) { toast.error("Enter a valid amount"); return; }
    onSave(num, notes, method);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 z-50 flex items-end"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 400, damping: 40 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full bg-white rounded-t-3xl px-5 pt-5 pb-10"
      >
        <div className="w-10 h-1 bg-[#EDE0DB] rounded-full mx-auto mb-5" />
        <h2 className="text-base font-bold text-[#1A0A0C] mb-1">
          {type === "bill" ? "Add Purchase Bill" : "Record Payment"}
        </h2>
        <p className="text-xs text-[#6B4C4F] mb-5">
          {type === "bill"
            ? `What you purchased from ${supplier.name}`
            : `Outstanding: ${formatCurrency(supplier.balanceDue)}`}
        </p>

        <label className="block text-xs font-semibold text-[#6B4C4F] mb-1.5">Amount (₹)</label>
        <input
          type="number"
          placeholder="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full bg-[#F9F6F2] border border-[#EDE0DB] rounded-xl px-4 py-3 text-xl font-bold text-[#1A0A0C] outline-none focus:border-[#8B1E24] mb-4"
          autoFocus
        />

        {type === "payment" && supplier.balanceDue > 0 && (
          <div className="flex gap-2 mb-4">
            {[0.25, 0.5, 0.75, 1].map((f) => {
              const val = Math.round(supplier.balanceDue * f);
              return (
                <button
                  key={f}
                  onClick={() => setAmount(val.toString())}
                  className="flex-1 py-1.5 rounded-lg bg-[#FFF8F4] border border-[#EDE0DB] text-xs font-semibold text-[#8B1E24]"
                >
                  {f === 1 ? "Full" : `${f * 100}%`}
                </button>
              );
            })}
          </div>
        )}

        {type === "payment" && (
          <>
            <label className="block text-xs font-semibold text-[#6B4C4F] mb-1.5">Payment Method</label>
            <div className="flex gap-2 mb-4 flex-wrap">
              {["Cash", "UPI", "Bank Transfer", "Card"].map((m) => (
                <button
                  key={m}
                  onClick={() => setMethod(m)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${method === m ? "bg-[#8B1E24] text-white border-[#8B1E24]" : "bg-white text-[#6B4C4F] border-[#EDE0DB]"}`}
                >
                  {m}
                </button>
              ))}
            </div>
          </>
        )}

        <label className="block text-xs font-semibold text-[#6B4C4F] mb-1.5">Notes (optional)</label>
        <input
          type="text"
          placeholder="Add a note..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full bg-[#F9F6F2] border border-[#EDE0DB] rounded-xl px-4 py-3 text-sm text-[#1A0A0C] outline-none focus:border-[#8B1E24] mb-5"
        />

        <button
          onClick={handleSave}
          className="w-full bg-[#8B1E24] text-white rounded-xl py-3.5 text-sm font-bold shadow-sm"
        >
          {type === "bill" ? "Save Bill" : "Record Payment"}
        </button>
      </motion.div>
    </motion.div>
  );
}

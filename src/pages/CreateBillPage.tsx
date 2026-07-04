import { useState, useMemo, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Search, Plus, X, ChevronDown, Receipt, Camera } from "lucide-react";
import QuantityCounter from "../app/components/QuantityCounter";
import { Switch } from "../app/components/ui/switch";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { formatCurrency } from "../lib/utils";
import { Share } from "@capacitor/share";
import { Filesystem, Directory } from "@capacitor/filesystem";
import html2pdf from "html2pdf.js";
import { toast } from "sonner";
import type { Doc, Id } from "../convex/_generated/dataModel";

type BillItem = {
  productId: Id<"products">;
  name: string;
  qty: number;
  price: number;
  cost: number;
  uom?: string;
  cgst: number;
  sgst: number;
};

function calcLineTotal(item: BillItem, round = false): number {
  const sub = item.qty * item.price;
  const total = sub + sub * ((item.cgst + item.sgst) / 100);
  return round ? (total < 0.01 ? 0 : Math.ceil(total)) : total;
}

export default function CreateBillPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const vendors = useQuery(api.vendors.getVendors) ?? [];
  const products = useQuery(api.products.getProducts) ?? [];
  const createTransaction = useMutation(api.transactions.createTransaction);

  const preselectedId = searchParams.get("customerId") || "";
  const [customerId, setCustomerId] = useState(preselectedId);
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomers, setShowCustomers] = useState(!preselectedId);
  const [productSearch, setProductSearch] = useState("");
  const [showProducts, setShowProducts] = useState(false);
  const [items, setItems] = useState<BillItem[]>([]);
  const [notes, setNotes] = useState("");
  const [roundPrices, setRoundPrices] = useState(false);

  const isNative = window.Capacitor?.getPlatform?.() !== "web" && window.Capacitor?.getPlatform?.() !== undefined;
  const invoiceRef = useRef<HTMLDivElement>(null);

  const selectedVendor = useMemo(() => vendors.find((v) => v._id === customerId), [vendors, customerId]);

  const filteredCustomers = useMemo(() =>
    vendors.filter((v) => v.name.toLowerCase().includes(customerSearch.toLowerCase()) || v.phone.includes(customerSearch)),
    [vendors, customerSearch]
  );

  const filteredProducts = useMemo(() =>
    products.filter((p) => p.name.toLowerCase().includes(productSearch.toLowerCase())),
    [products, productSearch]
  );

  const grandTotal = useMemo(() => items.reduce((s, item) => s + calcLineTotal(item, roundPrices), 0), [items, roundPrices]);
  const totalTax = useMemo(() => items.reduce((s, item) => {
    const sub = item.qty * item.price;
    return s + sub * ((item.cgst + item.sgst) / 100);
  }, 0), [items]);
  const subtotal = grandTotal - totalTax;

  const addProduct = (p: Doc<"products">) => {
    const existing = items.findIndex((i) => i.productId === p._id);
    if (existing >= 0) {
      setItems((prev) => prev.map((item, idx) => idx === existing ? { ...item, qty: item.qty + 1 } : item));
    } else {
      setItems((prev) => [...prev, {
        productId: p._id,
        name: p.name,
        qty: p.defaultQty || 1,
        price: p.defaultPrice,
        cost: p.purchasePrice,
        uom: p.uom,
        cgst: p.cgst,
        sgst: p.sgst,
      }]);
    }
    setShowProducts(false);
    setProductSearch("");
  };

  const updateQty = (idx: number, delta: number) => {
    setItems((prev) => prev.map((item, i) => i === idx ? { ...item, qty: Math.max(0, item.qty + delta) } : item));
  };

  const updatePrice = (idx: number, val: string) => {
    const price = parseFloat(val) || 0;
    setItems((prev) => prev.map((item, i) => i === idx ? { ...item, price } : item));
  };

  const removeItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const generatePdfBlob = useCallback(async () => {
    const el = invoiceRef.current;
    if (!el) return null;
    const clone = el.cloneNode(true) as HTMLElement;
    clone.style.position = "fixed";
    clone.style.left = "0";
    clone.style.top = "0";
    clone.style.zIndex = "9999";
    clone.style.pointerEvents = "none";
    clone.style.opacity = "0.001";
    clone.style.background = "#fff";
    document.body.appendChild(clone);
    try {
      const pdf = await html2pdf()
        .set({
          margin: 0,
          filename: `bill.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 3, useCORS: true, logging: false },
          jsPDF: { unit: "mm", format: [210, 297], orientation: "portrait" },
        })
        .from(clone)
        .toPdf()
        .get("pdf");
      return pdf.output("blob") as Blob;
    } catch {
      return null;
    } finally {
      document.body.removeChild(clone);
    }
  }, []);

  const handleSave = async (withWhatsApp = false) => {
    if (!customerId) { toast.error("Please select a customer"); return; }
    if (items.length === 0) { toast.error("Add at least one product"); return; }

    const profit = items.reduce((s, item) => s + (item.price - item.cost) * item.qty, 0);
    await createTransaction({
      type: "bill",
      vendorId: customerId as Id<"vendors">,
      vendorName: selectedVendor!.name,
      amount: roundPrices ? (grandTotal < 0.01 ? 0 : Math.ceil(grandTotal)) : grandTotal,
      profit: roundPrices ? Math.ceil(profit) : profit,
      date: new Date().toISOString(),
      notes: notes.trim() || undefined,
      items: items.map((item) => ({
        productId: item.productId,
        name: item.name,
        qty: item.qty,
        price: item.price,
        cost: item.cost,
        uom: item.uom,
        cgst: item.cgst,
        sgst: item.sgst,
        profit: (item.price - item.cost) * item.qty,
      })),
    });
    toast.success("Bill created!");

    if (withWhatsApp && selectedVendor) {
      const blob = await generatePdfBlob();
      if (!blob) { toast.error("Failed to generate PDF"); navigate("/bills"); return; }

      if (isNative) {
        try {
          const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
          const saved = await Filesystem.writeFile({
            path: `bill-${Date.now()}.pdf`,
            data: base64,
            directory: Directory.Cache,
          });
          await Share.share({
            title: "Bill",
            text: `Bill from Arasi for ${selectedVendor.name}`,
            files: [saved.uri],
          });
        } catch (e) {
          toast.error("Share failed");
        }
      } else {
        const file = new File([blob], `bill-${Date.now()}.pdf`, { type: "application/pdf" });
        if (navigator.canShare?.({ files: [file] })) {
          try {
            await navigator.share({ files: [file], title: "Bill", text: `Bill from Arasi for ${selectedVendor.name}` });
          } catch (e) {
            if (e instanceof Error && e.name !== "AbortError") {
              toast.error("Share failed");
            }
          }
        } else {
          toast.info("Sharing not supported on this browser");
        }
      }
    }
    navigate("/bills");
  };

  const today = new Date().toLocaleDateString("en-IN").replace(/\//g, "-");

  return (
    <>
      <div ref={invoiceRef} className="fixed left-0 top-0 w-[210mm] p-[10mm] text-sm font-sans leading-relaxed" style={{ zIndex: -9999, opacity: 0, pointerEvents: "none", fontFamily: "system-ui, -apple-system, sans-serif" }}>
        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>அரசி</h1>
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Milk Agency</h2>
          <p style={{ fontSize: 11, color: "#555", margin: "2px 0" }}>New Bus Stand, Opp. Aruppukottai</p>
          <p style={{ fontSize: 11, color: "#555", margin: 0 }}>Mobile: +91 95245 58005</p>
        </div>
        <hr style={{ border: "none", borderTop: "1px solid #000", margin: "6px 0" }} />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
          <div>
            <p style={{ margin: 0, fontSize: 12 }}><b>Date:</b> {today}</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ margin: 0, fontSize: 10 }}><b>A/C No:</b> 43520985452</p>
            <p style={{ margin: 0, fontSize: 10 }}><b>IFSC:</b> SBIN0061171</p>
            <p style={{ margin: 0, fontSize: 10 }}>State Bank of India - Aruppukottai</p>
          </div>
        </div>
        <div style={{ marginTop: 10 }}>
          <p style={{ margin: 0, fontWeight: 600, fontSize: 13 }}>Bill To</p>
          <p style={{ margin: 0, fontSize: 12 }}>{selectedVendor?.name}</p>
          {selectedVendor?.phone && <p style={{ margin: 0, fontSize: 12 }}>Phone: {selectedVendor.phone}</p>}
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 8, fontSize: 11 }}>
          <thead>
            <tr style={{ background: "#f0f0f0" }}>
              <th style={{ padding: "4px 6px", textAlign: "left", border: "1px solid #ccc" }}>S.No</th>
              <th style={{ padding: "4px 6px", textAlign: "left", border: "1px solid #ccc" }}>Product</th>
              <th style={{ padding: "4px 6px", textAlign: "center", border: "1px solid #ccc" }}>Qty</th>
              <th style={{ padding: "4px 6px", textAlign: "right", border: "1px solid #ccc" }}>Rate</th>
              <th style={{ padding: "4px 6px", textAlign: "right", border: "1px solid #ccc" }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i}>
                <td style={{ padding: "4px 6px", border: "1px solid #ccc" }}>{i + 1}</td>
                <td style={{ padding: "4px 6px", border: "1px solid #ccc" }}>{item.name}</td>
                <td style={{ padding: "4px 6px", border: "1px solid #ccc", textAlign: "center" }}>{item.qty} {item.uom || ""}</td>
                <td style={{ padding: "4px 6px", border: "1px solid #ccc", textAlign: "right" }}>₹{item.price.toFixed(2)}</td>
                <td style={{ padding: "4px 6px", border: "1px solid #ccc", textAlign: "right" }}>₹{(item.qty * item.price).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ marginTop: 6 }}>
          <p style={{ margin: 0, fontSize: 12, textAlign: "right" }}>Subtotal: ₹{subtotal.toFixed(2)}</p>
          {totalTax > 0 && <p style={{ margin: 0, fontSize: 12, textAlign: "right" }}>Tax (GST): ₹{totalTax.toFixed(2)}</p>}
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, textAlign: "right" }}>Grand Total: ₹{grandTotal.toFixed(2)}</p>
        </div>
        {notes && <p style={{ margin: "6px 0 0", fontSize: 11, fontStyle: "italic" }}>Notes: {notes}</p>}
        <div style={{ marginTop: 10, textAlign: "center", fontSize: 11 }}>Thank you for your business!</div>
      </div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="pb-48">
      <div className="px-5 pt-12 pb-4 bg-white sticky top-0 z-10 border-b border-[#EDE0DB]">
        <div className="flex items-center gap-3 mb-1">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-white border border-[#EDE0DB] flex items-center justify-center shadow-sm">
            <ArrowLeft size={18} className="text-[#1A0A0C]" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-[#1A0A0C]">Create Bill</h1>
            <p className="text-xs text-[#6B4C4F]">{items.length} items · {formatCurrency(grandTotal)}</p>
          </div>
        </div>
      </div>

      <div className="px-5 pt-4 space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#6B4C4F] mb-2">Customer *</p>
          {selectedVendor ? (
            <button
              onClick={() => { setShowCustomers(true); setCustomerId(""); }}
              className="w-full flex items-center gap-3 bg-[#FFF8F4] border border-[#8B1E24]/20 rounded-xl px-4 py-3"
            >
              <div className="w-9 h-9 rounded-lg bg-[#8B1E24]/10 flex items-center justify-center font-bold text-[#8B1E24] text-sm">
                {selectedVendor.avatar}
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-[#1A0A0C]">{selectedVendor.name}</p>
                <p className="text-xs text-[#6B4C4F]">{selectedVendor.phone}</p>
              </div>
              <ChevronDown size={16} className="text-[#6B4C4F]" />
            </button>
          ) : (
            <div>
              <div className="flex items-center gap-2 bg-[#F9F6F2] rounded-xl px-3.5 py-2.5 border border-[#EDE0DB]">
                <Search size={15} className="text-[#6B4C4F]" />
                <input
                  value={customerSearch}
                  onChange={(e) => { setCustomerSearch(e.target.value); setShowCustomers(true); }}
                  onFocus={() => setShowCustomers(true)}
                  placeholder="Search customers..."
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-[#6B4C4F]/50"
                  autoFocus
                />
              </div>
              {showCustomers && (
                <div className="mt-1 bg-white border border-[#EDE0DB] rounded-xl shadow-lg overflow-hidden max-h-48 overflow-y-auto">
                  {filteredCustomers.map((v) => (
                    <button
                      key={v._id}
                      onClick={() => { setCustomerId(v._id); setShowCustomers(false); setCustomerSearch(""); }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#FFF8F4] transition-colors border-b border-[#EDE0DB] last:border-0"
                    >
                      <div className="w-8 h-8 rounded-lg bg-[#FFF8F4] flex items-center justify-center font-bold text-[#8B1E24] text-xs">
                        {v.avatar}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-semibold text-[#1A0A0C]">{v.name}</p>
                        <p className="text-xs text-[#6B4C4F]">{v.phone}</p>
                      </div>
                      {v.dueAmount > 0 && <span className="text-xs text-[#8B1E24] font-semibold">{formatCurrency(v.dueAmount)} due</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#6B4C4F]">Items *</p>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <Switch checked={roundPrices} onCheckedChange={setRoundPrices} className="scale-75" />
                <span className="text-[10px] text-[#6B4C4F] font-medium">Round</span>
              </label>
            </div>
            <motion.button
              whileTap={{ scale: 0.93 }}
              onClick={() => setShowProducts(true)}
              className="flex items-center gap-1.5 bg-[#8B1E24] text-white rounded-lg px-3 py-1.5 text-xs font-semibold"
            >
              <Plus size={13} /> Add Product
            </motion.button>
          </div>

          <AnimatePresence>
            {showProducts && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mb-3"
              >
                <div className="flex items-center gap-2 bg-[#F9F6F2] rounded-xl px-3.5 py-2.5 border border-[#8B1E24]/30 mb-1">
                  <Search size={15} className="text-[#6B4C4F]" />
                  <input
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Search products..."
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-[#6B4C4F]/50"
                    autoFocus
                  />
                  <button onClick={() => { setShowProducts(false); setProductSearch(""); }}>
                    <X size={15} className="text-[#6B4C4F]" />
                  </button>
                </div>
                <div className="bg-white border border-[#EDE0DB] rounded-xl shadow-lg overflow-hidden max-h-52 overflow-y-auto">
                  {filteredProducts.map((p) => (
                    <button
                      key={p._id}
                      onClick={() => addProduct(p)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#FFF8F4] transition-colors border-b border-[#EDE0DB] last:border-0"
                    >
                      <div className="text-left">
                        <p className="text-sm font-semibold text-[#1A0A0C]">{p.name}</p>
                        <p className="text-xs text-[#6B4C4F]">{p.uom} · {p.type === "A" ? "Meat" : "Dairy"}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-[#8B1E24]">{formatCurrency(p.defaultPrice)}</p>
                        <p className="text-xs text-[#6B4C4F]">Tax: {p.cgst + p.sgst}%</p>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-2.5">
            {items.length === 0 ? (
              <div className="text-center py-8 bg-[#F9F6F2] rounded-xl border border-dashed border-[#EDE0DB]">
                <Receipt size={24} className="text-[#6B4C4F]/40 mx-auto mb-2" />
                <p className="text-xs text-[#6B4C4F]">No items added yet</p>
              </div>
            ) : (
              items.map((item, idx) => (
                <motion.div
                  key={`${item.productId}-${idx}`}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  className="bg-white border border-[#EDE0DB] rounded-2xl p-3.5 shadow-sm"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-bold text-[#1A0A0C]">{item.name}</p>
                      <p className="text-xs text-[#6B4C4F]">{item.uom} · Tax {item.cgst + item.sgst}%</p>
                    </div>
                    <button onClick={() => removeItem(idx)} className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center ml-2">
                      <X size={13} className="text-red-500" />
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <QuantityCounter
                      value={item.qty}
                      onDecrement={() => updateQty(idx, -1)}
                      onIncrement={() => updateQty(idx, 1)}
                      onChange={(v) => {
                        if (isNaN(v)) return;
                        setItems((prev) => prev.map((item, i) =>
                          i === idx ? { ...item, qty: Math.max(0, v) } : item
                        ));
                      }}
                    />
                    <div className="flex items-center gap-1.5 bg-[#F9F6F2] border border-[#EDE0DB] rounded-lg px-2.5 py-1.5 flex-1">
                      <span className="text-sm text-[#6B4C4F]">₹</span>
                      <input
                        type="number"
                        value={item.price}
                        onChange={(e) => updatePrice(idx, e.target.value)}
                        className="w-full bg-transparent text-sm font-bold text-[#1A0A0C] outline-none"
                      />
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-[#8B1E24]">{formatCurrency(calcLineTotal(item, roundPrices))}</p>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#6B4C4F] mb-2">Notes</p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional bill notes..."
            rows={2}
            className="w-full bg-[#F9F6F2] border border-[#EDE0DB] rounded-xl px-4 py-3 text-sm text-[#1A0A0C] placeholder:text-[#6B4C4F]/50 outline-none focus:border-[#8B1E24] resize-none"
          />
        </div>

        <button className="w-full flex items-center gap-3 bg-[#F9F6F2] border border-dashed border-[#EDE0DB] rounded-xl px-4 py-3 hover:border-[#8B1E24] transition-colors">
          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center border border-[#EDE0DB]">
            <Camera size={16} className="text-[#6B4C4F]" />
          </div>
          <p className="text-sm text-[#6B4C4F] font-medium">Attach bill image / photo</p>
        </button>
      </div>

      {items.length > 0 && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-0 left-0 right-0 flex justify-center"
        >
          <div className="w-full max-w-[430px] bg-white border-t border-[#EDE0DB] px-5 py-4 shadow-2xl">
            <div className="flex justify-between items-center mb-1">
              <p className="text-xs text-[#6B4C4F]">Subtotal</p>
              <p className="text-xs text-[#6B4C4F] font-medium">{formatCurrency(subtotal)}</p>
            </div>
            {totalTax > 0 && (
              <div className="flex justify-between items-center mb-1">
                <p className="text-xs text-[#6B4C4F]">Tax (GST)</p>
                <p className="text-xs text-[#6B4C4F] font-medium">{formatCurrency(totalTax)}</p>
              </div>
            )}
            <div className="flex justify-between items-center mb-4 pt-2 border-t border-[#EDE0DB]">
              <p className="text-base font-bold text-[#1A0A0C]">Grand Total</p>
              <p className="text-lg font-bold text-[#8B1E24]">{formatCurrency(grandTotal)}</p>
            </div>
            <div className="flex gap-2.5">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => handleSave(false)}
                className="flex-1 bg-[#8B1E24] text-white rounded-xl py-3.5 text-sm font-bold shadow-sm"
              >
                Save Bill
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => handleSave(true)}
                className="flex-1 bg-[#16A34A] text-white rounded-xl py-3.5 text-sm font-bold shadow-sm"
              >
                Save & WhatsApp
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
    </>
  );
}

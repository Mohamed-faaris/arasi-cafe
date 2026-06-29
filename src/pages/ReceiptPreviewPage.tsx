import { useMemo } from "react";
import { useParams, useNavigate } from "react-router";
import { motion } from "motion/react";
import { ArrowLeft, Printer, Share2 } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { formatCurrency, formatDate } from "../lib/utils";

export default function ReceiptPreviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const transactions = useQuery(api.transactions.getTransactions) ?? [];
  const vendors = useQuery(api.vendors.getVendors) ?? [];

  const tx = useMemo(() => transactions.find((t) => t._id === id), [transactions, id]);
  const vendor = useMemo(() => tx ? vendors.find((v) => v._id === tx.vendorId) : null, [vendors, tx]);

  if (!tx) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <p className="text-[#6B4C4F]">Receipt not found</p>
        <button onClick={() => navigate(-1)} className="text-[#8B1E24] font-semibold">Go back</button>
      </div>
    );
  }

  const isPayment = tx.type === "payment";
  const subtotal = (tx.items || []).reduce((s, i) => s + i.qty * i.price, 0);
  const totalTax = (tx.items || []).reduce((s, i) => {
    const sub = i.qty * i.price;
    return s + sub * ((i.cgst + i.sgst) / 100);
  }, 0);

  const handlePrint = () => window.print();

  const handleWhatsApp = () => {
    if (!vendor) return;
    const itemLines = (tx.items || []).map((i) => `  • ${i.name} x${i.qty} = ₹${(i.qty * i.price).toFixed(0)}`).join("\n");
    const msg = encodeURIComponent(
      isPayment
        ? `*Arasi Cafe - Payment Receipt*\n\nCustomer: ${vendor.name}\nDate: ${formatDate(tx.date)}\nAmount Paid: ₹${tx.amount}\nMethod: ${tx.paymentMethod || "Cash"}\n\n${tx.notes ? `Note: ${tx.notes}\n\n` : ""}Thank you! 🙏`
        : `*Arasi Cafe - Bill Receipt*\n\nCustomer: ${vendor.name}\nDate: ${formatDate(tx.date)}\n\n${itemLines}\n\nSubtotal: ₹${subtotal.toFixed(0)}\nTax: ₹${totalTax.toFixed(0)}\n*Total: ₹${tx.amount}*\n\n${tx.notes ? `Note: ${tx.notes}\n\n` : ""}Thank you! 🙏`
    );
    window.open(`https://wa.me/91${vendor.phone}?text=${msg}`, "_blank");
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="pb-8 bg-[#F9F6F2] min-h-screen">
      {/* Toolbar */}
      <div className="px-5 pt-12 pb-4 bg-white border-b border-[#EDE0DB] print:hidden">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-white border border-[#EDE0DB] flex items-center justify-center shadow-sm">
            <ArrowLeft size={18} className="text-[#1A0A0C]" />
          </button>
          <h1 className="text-base font-bold text-[#1A0A0C]">Receipt Preview</h1>
          <div className="flex gap-2">
            <button onClick={handleWhatsApp} className="w-9 h-9 rounded-xl bg-[#16A34A] flex items-center justify-center">
              <Share2 size={16} className="text-white" />
            </button>
            <button onClick={handlePrint} className="w-9 h-9 rounded-xl bg-[#8B1E24] flex items-center justify-center">
              <Printer size={16} className="text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Receipt card */}
      <div className="px-5 pt-5">
        <div id="receipt" className="bg-white rounded-2xl shadow-sm border border-[#EDE0DB] overflow-hidden">
          {/* Header */}
          <div className="bg-[#8B1E24] px-6 py-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center mx-auto mb-3">
              <svg width="32" height="32" viewBox="0 0 52 52" fill="none">
                <path d="M26 8C26 8 14 16 14 26C14 32.627 19.373 38 26 38C32.627 38 38 32.627 38 26C38 16 26 8 26 8Z" fill="#FFF8F4" fillOpacity="0.9"/>
                <path d="M26 38V44" stroke="#C99A4B" strokeWidth="3" strokeLinecap="round"/>
                <path d="M20 44H32" stroke="#C99A4B" strokeWidth="3" strokeLinecap="round"/>
                <circle cx="26" cy="25" r="5" fill="#C99A4B"/>
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white">Arasi Cafe</h2>
            <p className="text-sm text-white/70 mt-0.5">Fresh · Simple · Trusted</p>
            <p className="text-xs text-white/50 mt-1">GSTIN: 33AAACT1234L1Z7</p>
          </div>

          {/* Divider */}
          <div className="flex items-center px-6 py-3 bg-[#FFF8F4] border-b border-dashed border-[#EDE0DB]">
            <div className="-mx-7 flex-1 border-t-2 border-dashed border-[#EDE0DB]" />
          </div>

          {/* Receipt type badge */}
          <div className="px-6 pt-4 pb-2 flex justify-between items-center">
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${isPayment ? "bg-[#F0FDF4] text-[#16A34A]" : "bg-[#FFF8F4] text-[#8B1E24]"}`}>
              {isPayment ? "PAYMENT RECEIPT" : "BILL"}
            </span>
            <span className="text-xs text-[#6B4C4F] font-mono">{tx._id.toUpperCase().slice(0, 8)}</span>
          </div>

          {/* Customer + date */}
          <div className="px-6 pb-4 grid grid-cols-2 gap-4 border-b border-dashed border-[#EDE0DB]">
            <div>
              <p className="text-xs text-[#6B4C4F] mb-0.5">Customer</p>
              <p className="text-sm font-bold text-[#1A0A0C]">{tx.vendorName}</p>
              {vendor?.phone && <p className="text-xs text-[#6B4C4F]">{vendor.phone}</p>}
              {vendor?.address && <p className="text-xs text-[#6B4C4F]">{vendor.address}</p>}
              {vendor?.gstin && <p className="text-xs text-[#6B4C4F]">GSTIN: {vendor.gstin}</p>}
            </div>
            <div className="text-right">
              <p className="text-xs text-[#6B4C4F] mb-0.5">Date</p>
              <p className="text-sm font-bold text-[#1A0A0C]">{formatDate(tx.date)}</p>
              {tx.paymentMethod && (
                <>
                  <p className="text-xs text-[#6B4C4F] mt-1">Method</p>
                  <p className="text-xs font-semibold text-[#1A0A0C]">{tx.paymentMethod}</p>
                </>
              )}
            </div>
          </div>

          {/* Items (for bills) */}
          {!isPayment && tx.items && tx.items.length > 0 && (
            <div className="px-6 py-4 border-b border-dashed border-[#EDE0DB]">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-[#6B4C4F] border-b border-[#EDE0DB] pb-2">
                    <th className="text-left py-1.5 font-semibold">Item</th>
                    <th className="text-center font-semibold">Qty</th>
                    <th className="text-right font-semibold">Rate</th>
                    <th className="text-right font-semibold">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {tx.items.map((item, i) => {
                    const lineSub = item.qty * item.price;
                    const lineTax = lineSub * ((item.cgst + item.sgst) / 100);
                    return (
                      <tr key={i} className="border-b border-[#F9F6F2]">
                        <td className="py-2">
                          <p className="font-semibold text-[#1A0A0C]">{item.name}</p>
                          {(item.cgst + item.sgst) > 0 && <p className="text-[#6B4C4F]">GST {item.cgst + item.sgst}%</p>}
                        </td>
                        <td className="text-center py-2 text-[#1A0A0C]">{item.qty}{item.uom ? ` ${item.uom}` : ""}</td>
                        <td className="text-right py-2 text-[#1A0A0C]">₹{item.price}</td>
                        <td className="text-right py-2 font-semibold text-[#1A0A0C]">₹{(lineSub + lineTax).toFixed(0)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Totals */}
          <div className="px-6 py-4 border-b border-dashed border-[#EDE0DB] space-y-1.5">
            {!isPayment && (
              <>
                <div className="flex justify-between text-xs text-[#6B4C4F]">
                  <span>Subtotal</span><span>₹{subtotal.toFixed(0)}</span>
                </div>
                {totalTax > 0 && (
                  <div className="flex justify-between text-xs text-[#6B4C4F]">
                    <span>GST</span><span>₹{totalTax.toFixed(0)}</span>
                  </div>
                )}
              </>
            )}
            <div className="flex justify-between text-base font-bold text-[#1A0A0C] pt-2 border-t border-[#EDE0DB]">
              <span>{isPayment ? "Amount Paid" : "Grand Total"}</span>
              <span className="text-[#8B1E24]">{formatCurrency(tx.amount)}</span>
            </div>
          </div>

          {/* Notes */}
          {tx.notes && (
            <div className="px-6 py-3 border-b border-dashed border-[#EDE0DB]">
              <p className="text-xs text-[#6B4C4F]">Note: {tx.notes}</p>
            </div>
          )}

          {/* QR + footer */}
          <div className="px-6 py-5 text-center">
            <div className="w-16 h-16 rounded-xl bg-[#F9F6F2] border border-[#EDE0DB] flex items-center justify-center mx-auto mb-3">
              <div className="grid grid-cols-3 gap-0.5">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className={`w-3 h-3 rounded-sm ${Math.random() > 0.4 ? "bg-[#1A0A0C]" : "bg-transparent"}`} />
                ))}
              </div>
            </div>
            <p className="text-xs font-semibold text-[#C99A4B]">★ Thank you for your business! ★</p>
            <p className="text-xs text-[#6B4C4F] mt-1">Arasi Cafe · Fresh · Simple · Trusted</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 mt-5 print:hidden">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleWhatsApp}
            className="flex-1 flex items-center justify-center gap-2 bg-[#16A34A] text-white rounded-xl py-3.5 text-sm font-bold"
          >
            <Share2 size={16} /> Share WhatsApp
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 bg-[#8B1E24] text-white rounded-xl py-3.5 text-sm font-bold"
          >
            <Printer size={16} /> Print
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

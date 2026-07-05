import { useEffect, useMemo, useCallback, useRef, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router";
import { ArrowLeft, Download, Share2 } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Capacitor } from "@capacitor/core";
import { toast } from "sonner";
import ReceiptTemplate from "../components/ReceiptTemplate";
import { generatePdfBlob, downloadPdf, sharePdf } from "../utils/pdfUtils";

function formatCurrency(amount: number): string {
  return `\u20B9${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(dateString: string): string {
  return new Date(dateString)
    .toLocaleDateString("en-IN", { day: "numeric", month: "numeric", year: "numeric" })
    .replace(/\//g, "-");
}

function formatInvoiceNumber(date: string, seq: number, vendorName?: string): string {
  const d = new Date(date);
  const y = String(d.getFullYear()).slice(-2);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const prefix = vendorName
    ? vendorName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 4)
    : "XX";
  return `${prefix}/${y}${m}${day}/${String(seq).padStart(3, "0")}`;
}

export default function ReceiptPreviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const captureRef = useRef<HTMLDivElement>(null);
  const scaleContainerRef = useRef<HTMLDivElement>(null);
  const sharedRef = useRef(false);
  const [scale, setScale] = useState(1);
  const transactions = useQuery(api.transactions.getTransactions) ?? [];
  const vendors = useQuery(api.vendors.getVendors) ?? [];

  const tx = useMemo(() => transactions.find((t) => t._id === id), [transactions, id]);
  const vendor = useMemo(() => (tx ? vendors.find((v) => v._id === tx.vendorId) : null), [vendors, tx]);

  const isNative = Capacitor.isNativePlatform();

  const subtotal = useMemo(() => {
    if (!tx?.items) return 0;
    return tx.items.reduce((s, i) => s + i.qty * i.price, 0);
  }, [tx]);

  const totalCGST = useMemo(() => {
    if (!tx?.items) return 0;
    return tx.items.reduce((s, i) => s + i.qty * i.price * (i.cgst / 100), 0);
  }, [tx]);

  const totalSGST = useMemo(() => {
    if (!tx?.items) return 0;
    return tx.items.reduce((s, i) => s + i.qty * i.price * (i.sgst / 100), 0);
  }, [tx]);

  const grandTotal = subtotal + totalCGST + totalSGST;

  const invoiceNoFormatted = useMemo(() => {
    if (!tx?.invoiceNo) return "—";
    return formatInvoiceNumber(tx.date, tx.invoiceNo, tx.vendorName);
  }, [tx]);

  const fileName = useMemo(() => `bill-${tx?._id?.slice(-6) || "invoice"}.pdf`, [tx]);

  useEffect(() => {
    const el = scaleContainerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      setScale(Math.min(1, w / 800));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleShare = useCallback(async () => {
    const el = captureRef.current;
    if (!el || !tx) return;
    const blob = await generatePdfBlob(el);
    if (!blob) return;
    await sharePdf(blob, fileName, "Bill", `Bill from Arasi for ${tx.vendorName}`);
  }, [tx, fileName]);

  const handleDownload = useCallback(async () => {
    const el = captureRef.current;
    if (!el || !tx) return;
    const blob = await generatePdfBlob(el);
    if (!blob) return;
    if (isNative) {
      await downloadPdf(blob, fileName);
    } else {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, [tx, fileName, isNative]);

  useEffect(() => {
    if (tx && searchParams.get("share") === "1" && !sharedRef.current) {
      sharedRef.current = true;
      setTimeout(() => handleShare(), 500);
    }
  }, [tx, searchParams, handleShare]);

  if (!tx) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <p className="text-[#6B4C4F]">Receipt not found</p>
        <button onClick={() => navigate(-1)} className="text-[#8B1E24] font-semibold">
          Go back
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="px-5 pt-12 pb-4 bg-white border-b border-[#EDE0DB]">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl bg-white border border-[#EDE0DB] flex items-center justify-center shadow-sm"
          >
            <ArrowLeft size={18} className="text-[#1A0A0C]" />
          </button>
          <h1 className="text-base font-bold text-[#1A0A0C]">Receipt</h1>
          <div className="flex gap-2">
            <button
              onClick={handleShare}
              className="w-9 h-9 rounded-xl bg-[#16A34A] flex items-center justify-center"
            >
              <Share2 size={16} className="text-white" />
            </button>
            {!isNative && (
              <button
                onClick={handleDownload}
                className="w-9 h-9 rounded-xl bg-[#8B1E24] flex items-center justify-center"
              >
                <Download size={16} className="text-white" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div ref={scaleContainerRef} className="overflow-hidden flex justify-center" style={{ transform: `scale(${scale})`, transformOrigin: "top center" }}>
        <ReceiptTemplate
          transaction={tx}
          vendor={vendor}
          invoiceNoFormatted={invoiceNoFormatted}
          subtotal={subtotal}
          totalCGST={totalCGST}
          totalSGST={totalSGST}
          grandTotal={grandTotal}
        />
      </div>

      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
        <ReceiptTemplate
          ref={captureRef}
          transaction={tx}
          vendor={vendor}
          invoiceNoFormatted={invoiceNoFormatted}
          subtotal={subtotal}
          totalCGST={totalCGST}
          totalSGST={totalSGST}
          grandTotal={grandTotal}
        />
      </div>
    </div>
  );
}

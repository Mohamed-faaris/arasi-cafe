import { useEffect, useMemo, useCallback, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router";
import { ArrowLeft, Download, Share2 } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import ReceiptTemplate from "../components/ReceiptTemplate";
import { downloadPdfBlob, sharePdfBlob } from "../utils/pdfUtils";

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
  const receiptRef = useRef<HTMLDivElement>(null);
  const sharedRef = useRef(false);
  const transactions = useQuery(api.transactions.getTransactions) ?? [];
  const vendors = useQuery(api.vendors.getVendors) ?? [];

  const tx = useMemo(() => transactions.find((t) => t._id === id), [transactions, id]);
  const vendor = useMemo(() => (tx ? vendors.find((v) => v._id === tx.vendorId) : null), [vendors, tx]);

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

  const generatePdfBlob = useCallback(async (): Promise<Blob | null> => {
    if (!receiptRef.current) return null;
    try {
      const canvas = await html2canvas(receiptRef.current, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
        allowTaint: false,
      });

      const imgData = canvas.toDataURL("image/png");
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      const pdf = new jsPDF("p", "mm", "a4");
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const blob = pdf.output("blob");
      return blob;
    } catch (e) {
      console.error("PDF generation failed:", e);
      return null;
    }
  }, []);

  const handleDownload = useCallback(async () => {
    const blob = await generatePdfBlob();
    if (!blob) return;
    await downloadPdfBlob(blob, fileName);
  }, [fileName, generatePdfBlob]);

  const handleShare = useCallback(async () => {
    const blob = await generatePdfBlob();
    if (!blob) return;
    const title = `Bill - ${tx?.vendorName || ""}`;
    await sharePdfBlob(blob, fileName, title);
  }, [tx, fileName, generatePdfBlob]);

  const autoDownload = useCallback(async () => {
    const blob = await generatePdfBlob();
    if (!blob) return;
    await downloadPdfBlob(blob, fileName);
  }, [fileName, generatePdfBlob]);

  useEffect(() => {
    if (tx && searchParams.get("share") === "1" && !sharedRef.current) {
      sharedRef.current = true;
      setTimeout(() => autoDownload(), 500);
    }
  }, [tx, searchParams, autoDownload]);

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
            <button
              onClick={handleDownload}
              className="w-9 h-9 rounded-xl bg-[#8B1E24] flex items-center justify-center"
            >
              <Download size={16} className="text-white" />
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto p-4">
        <ReceiptTemplate
          ref={receiptRef}
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

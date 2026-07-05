import React from 'react';

interface BillItem {
  name: string;
  qty: number;
  price: number;
  uom?: string;
  cgst: number;
  sgst: number;
}

interface Transaction {
  _id: string;
  type: "payment" | "bill";
  vendorId: string;
  vendorName: string;
  amount: number;
  date: string;
  notes?: string;
  items?: BillItem[];
  invoiceNo?: number;
}

interface Vendor {
  address?: string;
  phone?: string;
  gstin?: string;
}

interface ReceiptTemplateProps {
  transaction: Transaction;
  vendor?: Vendor | null;
  invoiceNoFormatted: string;
  subtotal: number;
  totalCGST: number;
  totalSGST: number;
  grandTotal: number;
}

const fmt = (n: number) => `\u20B9${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString("en-IN", { day: "numeric", month: "numeric", year: "numeric" }).replace(/\//g, "-");

const s: Record<string, React.CSSProperties> = {
  page: {
    fontFamily: 'Arial, Helvetica, sans-serif',
    backgroundColor: '#ffffff',
    color: '#000000',
    padding: '30px',
    width: '794px',
    minHeight: '1123px',
    margin: 0,
    boxSizing: 'border-box',
    fontSize: '12px',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '18px',
    marginBottom: '20px',
  },
  logo: {
    width: '85px',
    height: '85px',
    objectFit: 'contain',
  },
  brandText: {
    flex: 1,
  },
  h1: {
    margin: '0',
    fontSize: '34px',
    letterSpacing: '1px',
  },
  h2: {
    margin: '4px 0',
    fontSize: '16px',
    fontWeight: 500,
  },
  pSmall: {
    margin: '2px 0',
    color: '#555',
    fontSize: '12px',
  },
  hr: {
    margin: '20px 0',
    border: 'none',
    borderTop: '2px solid #8B0000',
  },
  topRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '20px',
  },
  billInfo: {
    width: '58%',
  },
  billTable: {
    width: '100%',
    borderCollapse: 'collapse' as const,
  },
  billTd: {
    padding: '5px 0',
    fontSize: '12px',
  },
  bankBox: {
    border: '1px solid #ccc',
    padding: '12px',
    marginTop: '10px',
    background: '#fafafa',
  },
  bankLabel: {
    display: 'block',
    marginBottom: '4px',
    fontWeight: 'bold',
  },
  bankP: {
    margin: '3px 0',
    fontSize: '12px',
  },
  qrBox: {
    width: '220px',
    textAlign: 'center' as const,
  },
  qrImg: {
    width: '190px',
  },
  customerBox: {
    border: '1px solid #ccc',
    padding: '15px',
    marginBottom: '20px',
  },
  customerP: {
    margin: '4px 0',
    fontSize: '12px',
  },
  itemsTable: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: '12px',
  },
  itemsTh: {
    background: '#333',
    color: 'white',
    padding: '10px',
    border: '1px solid #333',
    textAlign: 'center' as const,
    fontWeight: 'bold',
  },
  itemsTd: {
    border: '1px solid #ddd',
    padding: '10px',
    textAlign: 'center' as const,
  },
  totalBox: {
    width: '320px',
    marginLeft: 'auto',
    marginTop: '20px',
  },
  totalTable: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: '12px',
  },
  totalTd: {
    padding: '6px',
  },
  grandTd: {
    padding: '6px',
    fontSize: '22px',
    fontWeight: 'bold',
  },
  footer: {
    marginTop: '70px',
    display: 'flex',
    justifyContent: 'center',
  },
  footerInner: {
    width: '250px',
    textAlign: 'center' as const,
  },
  line: {
    borderTop: '1px solid #000',
    marginBottom: '8px',
  },
  thanks: {
    textAlign: 'center' as const,
    marginTop: '60px',
    color: '#555',
    fontStyle: 'italic',
    fontSize: '12px',
  },
};

const ReceiptTemplate = React.forwardRef<HTMLDivElement, ReceiptTemplateProps>(
  ({ transaction, vendor, invoiceNoFormatted, subtotal, totalCGST, totalSGST, grandTotal }, ref) => {
    const isPayment = transaction.type === "payment";

    return (
      <div ref={ref} style={s.page}>
        <div style={s.brand}>
          <img src="/logo.png" alt="Arasi Logo" style={s.logo} />
          <div style={s.brandText}>
            <div style={s.h1}>அரசி</div>
            <div style={s.h2}>Milk Agency</div>
            <p style={s.pSmall}>New Bus Stand, Opp. Aruppukottai</p>
            <p style={s.pSmall}>Mobile : +91 95245 58005</p>
          </div>
        </div>

        <hr style={s.hr} />

        <div style={s.topRow}>
          <div style={s.billInfo}>
            <table style={s.billTable}>
              <tbody>
                <tr>
                  <td style={s.billTd}><b>Bill No :</b></td>
                  <td style={s.billTd}>{invoiceNoFormatted}</td>
                </tr>
                <tr>
                  <td style={s.billTd}><b>Date :</b></td>
                  <td style={s.billTd}>{fmtDate(transaction.date)}</td>
                </tr>
              </tbody>
            </table>

            <div style={s.bankBox}>
              <b style={s.bankLabel}>Bank Details</b>
              <p style={s.bankP}><b>A/C No :</b> 43520985452</p>
              <p style={s.bankP}><b>IFSC :</b> SBIN0061171</p>
              <p style={s.bankP}>State Bank of India - Aruppukottai</p>
            </div>
          </div>

          <div style={s.qrBox}>
            <img src="/qr.png" alt="Scan & Pay" style={s.qrImg} />
            <p style={s.pSmall}><b>Scan & Pay</b></p>
          </div>
        </div>

        <div style={s.customerBox}>
          <b>Bill To</b>
          <p style={s.customerP}>{transaction.vendorName}</p>
          {vendor?.address && <p style={s.customerP}>{vendor.address}</p>}
          {vendor?.phone && <p style={s.customerP}>Phone: {vendor.phone}</p>}
          {vendor?.gstin && <p style={s.customerP}>GSTIN: {vendor.gstin}</p>}
        </div>

        {!isPayment && transaction.items && transaction.items.length > 0 && (
          <table style={s.itemsTable}>
            <thead>
              <tr>
                <th style={s.itemsTh}>S.No</th>
                <th style={s.itemsTh}>Product</th>
                <th style={s.itemsTh}>Qty</th>
                <th style={s.itemsTh}>Rate</th>
                <th style={s.itemsTh}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {transaction.items.map((item, i) => (
                <tr key={i}>
                  <td style={s.itemsTd}>{i + 1}</td>
                  <td style={s.itemsTd}>{item.name}</td>
                  <td style={s.itemsTd}>{item.qty} {item.uom || ""}</td>
                  <td style={s.itemsTd}>{fmt(item.price)}</td>
                  <td style={s.itemsTd}>{fmt(item.qty * item.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div style={s.totalBox}>
          <table style={s.totalTable}>
            <tbody>
              <tr>
                <td style={s.totalTd}>Subtotal</td>
                <td align="right" style={s.totalTd}>{fmt(subtotal)}</td>
              </tr>
              {totalCGST > 0 && (
                <tr>
                  <td style={s.totalTd}>CGST @ 2.5%</td>
                  <td align="right" style={s.totalTd}>{fmt(totalCGST)}</td>
                </tr>
              )}
              {totalSGST > 0 && (
                <tr>
                  <td style={s.totalTd}>SGST @ 2.5%</td>
                  <td align="right" style={s.totalTd}>{fmt(totalSGST)}</td>
                </tr>
              )}
              <tr>
                <td style={s.totalTd}>Discount</td>
                <td align="right" style={s.totalTd}>₹0.00</td>
              </tr>
              <tr>
                <td colSpan={2} style={{ ...s.grandTd, textAlign: 'right' as const }}>
                  Grand Total: {fmt(grandTotal)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style={s.footer}>
          <div style={s.footerInner}>
            <div style={s.line}></div>
            For அரசி Milk Agency
          </div>
        </div>

        <div style={s.thanks}>Thank you for your business!</div>
      </div>
    );
  }
);

export default ReceiptTemplate;

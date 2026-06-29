# Arasi Cafe – Complete UI/UX Redesign Plan

## Context

The existing Dairy Ledger application (https://github.com/Mohamed-faaris/dairy) is a mobile-first React + Convex ledger app for small businesses. The goal is a complete UI/UX redesign that preserves 100% of the existing features while delivering a premium, Apple/Linear/Stripe-inspired cafe management experience branded as **Arasi Cafe**. The Convex backend is not available in this sandbox, so all data will be driven by localStorage-persisted mock state with the same shape as the real schema.

---

## Brand & Design Tokens

### Fonts (fonts.css)
```
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800&display=swap');
```
- **Body / UI**: Plus Jakarta Sans — modern, premium, legible at small sizes
- **Display headings**: Plus Jakarta Sans 700–800 with tight tracking

### Color Tokens (theme.css)
| Token | Value | Purpose |
|---|---|---|
| `--background` | `#FFFFFF` | Main background |
| `--foreground` | `#1A0A0C` | Body text |
| `--primary` | `#8B1E24` | Deep Maroon — primary actions |
| `--primary-foreground` | `#FFF8F4` | Text on primary |
| `--secondary` | `#FFF8F4` | Soft Cream panels |
| `--secondary-foreground` | `#8B1E24` | Text on secondary |
| `--accent` | `#C99A4B` | Muted Gold — highlights, badges |
| `--accent-foreground` | `#FFFFFF` | Text on accent |
| `--muted` | `#F9F6F2` | Warm Ivory — card bg, inputs |
| `--muted-foreground` | `#6B4C4F` | Subdued text |
| `--destructive` | `#DC2626` | Error / delete |
| `--success` | `#16A34A` | Forest green — success states |
| `--border` | `#EDE0DB` | Subtle cream border |
| `--card` | `#FFFFFF` | Card background |
| `--radius` | `1rem` | Base border radius |

---

## File Structure

```
src/
├── app/App.tsx               # Root: router, nav, context
├── styles/
│   ├── fonts.css             # Google Fonts import
│   └── theme.css             # Updated brand tokens
├── data/
│   └── store.ts              # localStorage mock store + types
└── pages/
    ├── SplashPage.tsx
    ├── DashboardPage.tsx
    ├── CustomerListPage.tsx
    ├── CustomerDetailPage.tsx
    ├── AddCustomerPage.tsx
    ├── CreateBillPage.tsx
    ├── BillDetailPage.tsx
    ├── ReceivePaymentPage.tsx
    ├── PaymentSuccessPage.tsx
    ├── ProductListPage.tsx
    ├── AddEditProductPage.tsx
    ├── AnalyticsPage.tsx
    ├── BillHistoryPage.tsx
    ├── PaymentHistoryPage.tsx
    ├── ReceiptPreviewPage.tsx
    └── WhatsAppPreviewPage.tsx
```

All files are new. `src/app/App.tsx` is the entry point and re-exports the router.

---

## Data Layer (src/data/store.ts)

Mirror the real Convex schema exactly using localStorage + a tiny reactive context so all pages stay in sync.

**Types** (matching the real schema):
```ts
Vendor { _id, name, phone, dueAmount, lastTransaction, avatar, daysOverdue, gstin?, address? }
Transaction { _id, type: "bill"|"payment", vendorId, vendorName, amount, profit, date, notes?, imageUrl?, paymentMethod?, items? }
Product { _id, name, defaultPrice, defaultQty, type: "A"|"B", purchasePrice, uom?, cgst, sgst }
Supplier { _id, name, phone, address?, totalPurchases, totalPaid, balanceDue, lastPurchase, avatar }
Purchase { _id, supplierId, supplierName, productId?, productName, qty, unitPrice, totalAmount, date, notes?, imageUrl? }
SupplierPayment { _id, supplierId, supplierName, amount, date, notes?, paymentMethod?, imageUrl? }
```

**Store API** (all synchronous, persist to localStorage):
- `useStore()` hook returning `{ vendors, transactions, products, suppliers, purchases, supplierPayments, dispatch }`
- `dispatch(action)` for mutations: `ADD_VENDOR`, `UPDATE_VENDOR`, `DELETE_VENDOR`, `ADD_TRANSACTION`, `UPDATE_TRANSACTION`, `DELETE_TRANSACTION`, `ADD_PRODUCT`, `UPDATE_PRODUCT`, `DELETE_PRODUCT`, `ADD_SUPPLIER`, `ADD_PURCHASE`, `ADD_SUPPLIER_PAYMENT`
- Auto-recalculates `vendor.dueAmount` after every bill/payment mutation
- Seeded with realistic mock data (5 vendors, 10 transactions, 6 products, 3 suppliers)

---

## Pages

### 1. SplashPage
- Full-screen cream background
- Animated logo (scale + fade in with motion)
- "Arasi Cafe" wordmark in Deep Maroon
- Tagline: "Fresh. Simple. Trusted."
- Gold progress bar animates to 100%, then navigates to `/dashboard`
- Duration: ~2.5 seconds

### 2. DashboardPage (`/dashboard`)
- Top bar: "Good morning, Arasi Cafe ☕" + date
- 4-stat grid: Today's Sales, Outstanding Due, Total Customers, Total Bills
- Revenue chart (Recharts AreaChart, maroon fill) — weekly trend
- Outstanding trend (LineChart)
- Recent Activity list (last 5 transactions, type-tagged)
- Best Selling Products (top 3 by frequency)
- Quick Actions: New Bill, Receive Payment, Add Customer, Add Product, Analytics

### 3. CustomerListPage (`/customers`)
- Search bar with debounce
- Filter chips: All / Has Due / Paid Up
- Sort dropdown: Name, Due Amount, Last Active
- Customer cards: avatar (initials circle, maroon), name, phone, due badge
- Outstanding badge in gold if > 0
- Tap card → `/customers/:id`
- FAB (maroon) → `/customers/new`

### 4. CustomerDetailPage (`/customers/:id`)
- Profile header: avatar, name, phone, address
- Outstanding amount in large typography (maroon if > 0, green if 0)
- Two action buttons: "New Bill" + "Receive Payment"
- Transaction timeline: bills (maroon icon) + payments (green icon), sorted by date
- Each transaction: amount, date, notes preview, tap → detail
- Notes section
- "Share Statement" button → WhatsApp share

### 5. AddCustomerPage (`/customers/new`)
- Form: Name*, Phone*, Address, Opening Balance, GSTIN
- Animated field transitions
- Save button (maroon, full-width)
- Validation with inline error messages

### 6. CreateBillPage (`/bills/new?customerId=`)
- Customer selector (searchable dropdown)
- Product search with autocomplete
- Line items: product name, qty stepper (+/-), price (editable), tax
- Running subtotal + tax breakdown + grand total (sticky footer)
- Notes textarea
- Attach image / camera button
- Live total updates on qty/price change
- "Save Bill" + "Save & WhatsApp" CTA

### 7. BillDetailPage (`/bills/:id`)
- Customer info header
- Itemized table: product, qty, price, tax, subtotal
- Notes, attached image thumbnail
- Status badge: Paid / Partial / Outstanding
- Action buttons: "Record Payment", "Share via WhatsApp"
- Edit / Delete (confirmation dialog before delete)

### 8. ReceivePaymentPage (`/payments/new?customerId=`)
- Outstanding summary card
- Amount input (large, centered)
- Suggested chips: 25%, 50%, 75%, Full
- Payment method radio: Cash / UPI / Card / Bank Transfer
- Notes textarea
- "Slide to Confirm" button (animated slider)
- WhatsApp receipt toggle

### 9. PaymentSuccessPage (`/payments/success`)
- Full-screen success animation (checkmark with gold ring, motion)
- "Payment Recorded" heading
- Summary card: amount paid, customer, remaining balance
- Action buttons: "Share Receipt" (WhatsApp), "View Receipt", "Back to Dashboard"

### 10. ProductListPage (`/products`)
- Search bar
- Category chips: All / Type A (Meat) / Type B (Dairy)
- Product cards: name, sell price, cost price, tax, edit/delete
- FAB → `/products/new`

### 11. AddEditProductPage (`/products/new` or `/products/:id/edit`)
- Fields: Name, Category (A/B), UOM, Selling Price, Purchase Price, CGST %, SGST %
- Default Qty
- Save / Cancel

### 12. AnalyticsPage (`/analytics`)
- Period selector: Daily / Weekly / Monthly
- KPI cards: Total Revenue, Total Bills, Avg Bill Value, Total Outstanding
- Revenue area chart (maroon)
- Outstanding trend line chart (gold)
- Top Products table (rank, name, count, revenue)
- Top Customers table (rank, name, bills, total paid)
- Outstanding Summary donut chart

### 13. BillHistoryPage (`/bills`)
- Full bill list with search
- Filter by customer (dropdown), date range (date pickers), status
- Bill card: customer name, amount, date, items count, status badge
- Tap → BillDetailPage

### 14. PaymentHistoryPage (`/payments`)
- Full payment list with search
- Filter by customer, date range, payment method
- Payment row: customer, amount, date, method badge
- Tap → ReceiptPreviewPage

### 15. ReceiptPreviewPage (`/receipts/:id`)
- Print-ready A4-ish layout in white card
- Arasi Cafe logo + GSTIN header
- Customer details
- Itemized table with taxes
- Grand total
- QR code placeholder
- "Thank you for your business" footer
- Action buttons: Print (window.print), Share via WhatsApp

### 16. WhatsAppSharePreviewPage (`/share/:id`)
- Preview of the formatted WhatsApp message (monospace chat bubble style)
- Bill receipt OR payment receipt format
- Customer statement format
- "Share on WhatsApp" → deep link to wa.me with encoded message

---

## Navigation

### Bottom Navigation (mobile-first, always visible)
5 tabs with icons (Lucide):
1. Dashboard (`LayoutDashboard`) → `/dashboard`
2. Customers (`Users`) → `/customers`
3. Bills (`FileText`) → `/bills`
4. Products (`Package`) → `/products`
5. Analytics (`BarChart3`) → `/analytics`

Suppliers accessible from Dashboard quick actions (no dedicated tab to keep nav clean).

### Page Transitions
- All page changes use `motion` AnimatePresence with a subtle slide-up + fade
- Cards stagger-animate in on mount

---

## UI Components (design system)

All built inline in the pages they first appear, then reused:

| Component | Spec |
|---|---|
| `Button` | maroon fill / outline / ghost; md/lg sizes; ripple on tap |
| `Input` | Cream bg, maroon focus ring, rounded-xl |
| `Card` | White bg, `shadow-sm`, `rounded-2xl`, cream border |
| `Badge` | Gold (outstanding), green (paid), maroon (bill), gray (draft) |
| `FAB` | Maroon circle, 56px, bottom-right, shadow-lg |
| `BottomSheet` | Radix Dialog repurposed; slides up from bottom |
| `SearchBar` | Cream bg, search icon, clear button |
| `Chip` | Pill-shaped filter chip; maroon when active |
| `Toast` | Sonner, maroon primary style |
| `Skeleton` | Cream shimmer loading placeholders |
| `EmptyState` | Centered illustration (SVG) + message |
| `ConfirmDialog` | Radix AlertDialog with destructive variant |

---

## Motion Strategy

- **Page enter**: `y: 16, opacity: 0` → `y: 0, opacity: 1` over 300ms ease-out
- **Card stagger**: `staggerChildren: 0.05` on list containers
- **FAB**: Spring scale on mount
- **Success checkmark**: SVG path draw animation + gold ring scale
- **Chart bars**: Recharts built-in animation (`isAnimationActive`)
- **Button press**: `whileTap={{ scale: 0.97 }}`
- **Slide-to-confirm**: Draggable motion div constrained to track width

---

## Implementation Order

1. `src/styles/fonts.css` — Google Fonts import
2. `src/styles/theme.css` — Brand tokens (preserve token names, update values)
3. `src/data/store.ts` — Types, localStorage store, mock seed, `useStore` hook
4. `src/app/App.tsx` — Router setup, BottomNav, context provider, Splash redirect
5. Pages in dependency order:
   - SplashPage
   - DashboardPage
   - CustomerListPage → CustomerDetailPage → AddCustomerPage
   - CreateBillPage → BillDetailPage → BillHistoryPage
   - ReceivePaymentPage → PaymentSuccessPage → PaymentHistoryPage
   - ProductListPage → AddEditProductPage
   - AnalyticsPage
   - ReceiptPreviewPage → WhatsAppSharePreviewPage

---

## Verification

1. **Splash**: Loads first, animates, auto-redirects to Dashboard
2. **Dashboard**: Shows seeded stats, charts render, quick actions navigate
3. **Customer CRUD**: Add → list → detail → update balance after bill/payment
4. **Bill creation**: Item math correct (qty × price + tax = total), saved to store, vendor.dueAmount updates
5. **Payment recording**: Slider confirms, dueAmount decreases, success screen shows
6. **Products**: CRUD works, categories filter
7. **Analytics**: Charts reflect real store data, period toggle updates
8. **Receipt**: Print layout renders, WhatsApp link encodes message
9. **Navigation**: All 5 tabs navigate correctly; back navigation works
10. **Persistence**: Refresh page → data survives via localStorage

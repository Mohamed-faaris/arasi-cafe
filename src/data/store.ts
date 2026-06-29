import { useState, useEffect } from "react";

// ============================================================
// Types (mirror real Convex schema)
// ============================================================

export type Vendor = {
  _id: string;
  name: string;
  phone: string;
  dueAmount: number;
  lastTransaction: string;
  avatar: string;
  daysOverdue: number;
  gstin?: string;
  address?: string;
  openingBalance?: number;
};

export type TransactionItem = {
  productId?: string;
  cost?: number;
  name: string;
  qty: number;
  price: number;
  uom?: string;
  cgst: number;
  sgst: number;
  profit: number;
};

export type Transaction = {
  _id: string;
  type: "bill" | "payment";
  vendorId: string;
  vendorName: string;
  amount: number;
  profit: number;
  date: string;
  notes?: string;
  imageUrl?: string;
  paymentMethod?: string;
  items?: TransactionItem[];
};

export type Product = {
  _id: string;
  name: string;
  defaultPrice: number;
  defaultQty: number;
  type: "A" | "B";
  purchasePrice: number;
  uom?: string;
  cgst: number;
  sgst: number;
};

export type Supplier = {
  _id: string;
  name: string;
  phone: string;
  address?: string;
  totalPurchases: number;
  totalPaid: number;
  balanceDue: number;
  lastPurchase: string;
  avatar: string;
};

export type StoreData = {
  vendors: Vendor[];
  transactions: Transaction[];
  products: Product[];
  suppliers: Supplier[];
  supplierTransactions: SupplierTransaction[];
};

// ============================================================
// Helpers
// ============================================================

export function genId(): string {
  return Math.random().toString(36).slice(2, 11);
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

export function isToday(iso: string): boolean {
  const d = new Date(iso);
  const t = new Date();
  return d.getDate() === t.getDate() && d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear();
}

export function calcItemTotal(item: TransactionItem): number {
  const sub = item.qty * item.price;
  const tax = sub * ((item.cgst + item.sgst) / 100);
  return sub + tax;
}

// ============================================================
// Seed Data
// ============================================================

const now = new Date();
const d = (daysAgo: number) => new Date(now.getTime() - daysAgo * 86_400_000).toISOString();

const SEED_VENDORS: Vendor[] = [
  { _id: "v1", name: "Rajesh Kumar", phone: "9876543210", dueAmount: 4500, lastTransaction: d(0), avatar: "RK", daysOverdue: 0, address: "12 Anna Nagar, Chennai", gstin: "33AABCT1332L1Z7", openingBalance: 0 },
  { _id: "v2", name: "Priya Lakshmi", phone: "8765432109", dueAmount: 1200, lastTransaction: d(1), avatar: "PL", daysOverdue: 1, address: "45 T.Nagar, Chennai", openingBalance: 0 },
  { _id: "v3", name: "Mohammed Farooq", phone: "7654321098", dueAmount: 0, lastTransaction: d(2), avatar: "MF", daysOverdue: 0, address: "78 Adyar, Chennai", openingBalance: 0 },
  { _id: "v4", name: "Kavitha Devi", phone: "9543210987", dueAmount: 3750, lastTransaction: d(7), avatar: "KD", daysOverdue: 7, address: "23 Velachery, Chennai", openingBalance: 0 },
  { _id: "v5", name: "Suresh Babu", phone: "9432109876", dueAmount: 3200, lastTransaction: d(14), avatar: "SB", daysOverdue: 14, address: "56 Tambaram, Chennai", openingBalance: 0 },
];

const SEED_PRODUCTS: Product[] = [
  { _id: "p1", name: "Full Cream Milk", defaultPrice: 62, defaultQty: 1, type: "B", purchasePrice: 55, uom: "L", cgst: 0, sgst: 0 },
  { _id: "p2", name: "Paneer", defaultPrice: 380, defaultQty: 1, type: "B", purchasePrice: 320, uom: "kg", cgst: 2.5, sgst: 2.5 },
  { _id: "p3", name: "Butter", defaultPrice: 520, defaultQty: 1, type: "B", purchasePrice: 460, uom: "kg", cgst: 2.5, sgst: 2.5 },
  { _id: "p4", name: "Mutton", defaultPrice: 780, defaultQty: 1, type: "A", purchasePrice: 680, uom: "kg", cgst: 0, sgst: 0 },
  { _id: "p5", name: "Chicken", defaultPrice: 220, defaultQty: 1, type: "A", purchasePrice: 180, uom: "kg", cgst: 0, sgst: 0 },
  { _id: "p6", name: "Curd", defaultPrice: 48, defaultQty: 1, type: "B", purchasePrice: 40, uom: "kg", cgst: 0, sgst: 0 },
];

const SEED_TRANSACTIONS: Transaction[] = [
  {
    _id: "t1", type: "bill", vendorId: "v1", vendorName: "Rajesh Kumar",
    amount: 2500, profit: 380, date: d(0), notes: "Weekly supply",
    items: [
      { productId: "p1", name: "Full Cream Milk", qty: 20, price: 62, cost: 55, uom: "L", cgst: 0, sgst: 0, profit: 140 },
      { productId: "p2", name: "Paneer", qty: 3, price: 380, cost: 320, uom: "kg", cgst: 2.5, sgst: 2.5, profit: 180 },
      { productId: "p6", name: "Curd", qty: 10, price: 48, cost: 40, uom: "kg", cgst: 0, sgst: 0, profit: 80 },
    ],
  },
  {
    _id: "t2", type: "payment", vendorId: "v1", vendorName: "Rajesh Kumar",
    amount: 2000, profit: 0, date: d(1), paymentMethod: "UPI", notes: "Partial payment",
  },
  {
    _id: "t3", type: "bill", vendorId: "v2", vendorName: "Priya Lakshmi",
    amount: 1200, profit: 220, date: d(1), notes: "Daily order",
    items: [
      { productId: "p1", name: "Full Cream Milk", qty: 10, price: 62, cost: 55, uom: "L", cgst: 0, sgst: 0, profit: 70 },
      { productId: "p3", name: "Butter", qty: 1, price: 520, cost: 460, uom: "kg", cgst: 2.5, sgst: 2.5, profit: 60 },
    ],
  },
  {
    _id: "t4", type: "bill", vendorId: "v3", vendorName: "Mohammed Farooq",
    amount: 3200, profit: 560, date: d(2),
    items: [
      { productId: "p4", name: "Mutton", qty: 3, price: 780, cost: 680, uom: "kg", cgst: 0, sgst: 0, profit: 300 },
      { productId: "p5", name: "Chicken", qty: 4, price: 220, cost: 180, uom: "kg", cgst: 0, sgst: 0, profit: 160 },
    ],
  },
  {
    _id: "t5", type: "payment", vendorId: "v3", vendorName: "Mohammed Farooq",
    amount: 3200, profit: 0, date: d(2), paymentMethod: "Cash", notes: "Full payment",
  },
  {
    _id: "t6", type: "bill", vendorId: "v4", vendorName: "Kavitha Devi",
    amount: 8750, profit: 1250, date: d(7),
    items: [
      { productId: "p2", name: "Paneer", qty: 10, price: 380, cost: 320, uom: "kg", cgst: 2.5, sgst: 2.5, profit: 600 },
      { productId: "p3", name: "Butter", qty: 5, price: 520, cost: 460, uom: "kg", cgst: 2.5, sgst: 2.5, profit: 300 },
      { productId: "p6", name: "Curd", qty: 20, price: 48, cost: 40, uom: "kg", cgst: 0, sgst: 0, profit: 160 },
    ],
  },
  {
    _id: "t7", type: "payment", vendorId: "v4", vendorName: "Kavitha Devi",
    amount: 5000, profit: 0, date: d(3), paymentMethod: "Bank Transfer", notes: "Partial payment",
  },
  {
    _id: "t8", type: "bill", vendorId: "v5", vendorName: "Suresh Babu",
    amount: 3200, profit: 480, date: d(14),
    items: [
      { productId: "p1", name: "Full Cream Milk", qty: 30, price: 62, cost: 55, uom: "L", cgst: 0, sgst: 0, profit: 210 },
      { productId: "p5", name: "Chicken", qty: 2, price: 220, cost: 180, uom: "kg", cgst: 0, sgst: 0, profit: 80 },
    ],
  },
  {
    _id: "t9", type: "bill", vendorId: "v1", vendorName: "Rajesh Kumar",
    amount: 4000, profit: 620, date: d(5),
    items: [
      { productId: "p1", name: "Full Cream Milk", qty: 25, price: 62, cost: 55, uom: "L", cgst: 0, sgst: 0, profit: 175 },
      { productId: "p4", name: "Mutton", qty: 2, price: 780, cost: 680, uom: "kg", cgst: 0, sgst: 0, profit: 200 },
    ],
  },
  {
    _id: "t10", type: "bill", vendorId: "v2", vendorName: "Priya Lakshmi",
    amount: 960, profit: 140, date: d(30),
    items: [
      { productId: "p6", name: "Curd", qty: 20, price: 48, cost: 40, uom: "kg", cgst: 0, sgst: 0, profit: 160 },
    ],
  },
  {
    _id: "t11", type: "bill", vendorId: "v1", vendorName: "Rajesh Kumar",
    amount: 1860, profit: 280, date: d(3),
    items: [
      { productId: "p1", name: "Full Cream Milk", qty: 15, price: 62, cost: 55, uom: "L", cgst: 0, sgst: 0, profit: 105 },
      { productId: "p6", name: "Curd", qty: 8, price: 48, cost: 40, uom: "kg", cgst: 0, sgst: 0, profit: 64 },
    ],
  },
  {
    _id: "t12", type: "payment", vendorId: "v5", vendorName: "Suresh Babu",
    amount: 0, profit: 0, date: d(14), paymentMethod: "Cash",
  },
];

const SEED_SUPPLIERS: Supplier[] = [
  { _id: "s1", name: "Chennai Dairy Farm", phone: "9800001111", address: "Madhavaram, Chennai", totalPurchases: 45000, totalPaid: 40000, balanceDue: 5000, lastPurchase: d(1), avatar: "CD" },
  { _id: "s2", name: "Arun Meat Suppliers", phone: "9800002222", address: "Koyambedu, Chennai", totalPurchases: 28000, totalPaid: 28000, balanceDue: 0, lastPurchase: d(2), avatar: "AM" },
  { _id: "s3", name: "Fresh Products Co", phone: "9800003333", address: "Perambur, Chennai", totalPurchases: 15000, totalPaid: 12000, balanceDue: 3000, lastPurchase: d(7), avatar: "FP" },
];

const SEED_SUPPLIER_TRANSACTIONS: SupplierTransaction[] = [
  { _id: "st1", type: "purchase", supplierId: "s1", supplierName: "Chennai Dairy Farm", amount: 25000, date: d(1), notes: "Weekly milk supply" },
  { _id: "st2", type: "payment", supplierId: "s1", supplierName: "Chennai Dairy Farm", amount: 20000, date: d(1), paymentMethod: "UPI" },
  { _id: "st3", type: "purchase", supplierId: "s1", supplierName: "Chennai Dairy Farm", amount: 20000, date: d(8), notes: "Previous week supply" },
  { _id: "st4", type: "purchase", supplierId: "s2", supplierName: "Arun Meat Suppliers", amount: 28000, date: d(2), notes: "Meat supply" },
  { _id: "st5", type: "payment", supplierId: "s2", supplierName: "Arun Meat Suppliers", amount: 28000, date: d(2), paymentMethod: "Bank Transfer" },
  { _id: "st6", type: "purchase", supplierId: "s3", supplierName: "Fresh Products Co", amount: 15000, date: d(7), notes: "Curd and butter" },
  { _id: "st7", type: "payment", supplierId: "s3", supplierName: "Fresh Products Co", amount: 12000, date: d(5), paymentMethod: "Cash" },
];

// ============================================================
// Actions
// ============================================================

export type SupplierTransaction = {
  _id: string;
  type: "purchase" | "payment";
  supplierId: string;
  supplierName: string;
  amount: number;
  date: string;
  notes?: string;
  paymentMethod?: string;
};

export type Action =
  | { type: "ADD_VENDOR"; vendor: Omit<Vendor, "_id" | "avatar" | "daysOverdue" | "lastTransaction"> }
  | { type: "UPDATE_VENDOR"; vendor: Vendor }
  | { type: "DELETE_VENDOR"; id: string }
  | { type: "ADD_TRANSACTION"; transaction: Omit<Transaction, "_id"> }
  | { type: "UPDATE_TRANSACTION"; transaction: Transaction }
  | { type: "DELETE_TRANSACTION"; id: string }
  | { type: "ADD_PRODUCT"; product: Omit<Product, "_id"> }
  | { type: "UPDATE_PRODUCT"; product: Product }
  | { type: "DELETE_PRODUCT"; id: string }
  | { type: "ADD_SUPPLIER"; supplier: Omit<Supplier, "_id" | "avatar" | "totalPurchases" | "totalPaid" | "balanceDue" | "lastPurchase"> }
  | { type: "ADD_SUPPLIER_TRANSACTION"; tx: Omit<SupplierTransaction, "_id"> }
  | { type: "DELETE_SUPPLIER_TRANSACTION"; id: string };

// ============================================================
// Reducer
// ============================================================

function reducer(state: StoreData, action: Action): StoreData {
  switch (action.type) {
    case "ADD_VENDOR": {
      const v: Vendor = {
        _id: genId(),
        avatar: getInitials(action.vendor.name),
        lastTransaction: new Date().toISOString(),
        daysOverdue: 0,
        ...action.vendor,
      };
      return { ...state, vendors: [...state.vendors, v] };
    }
    case "UPDATE_VENDOR":
      return { ...state, vendors: state.vendors.map((v) => (v._id === action.vendor._id ? action.vendor : v)) };
    case "DELETE_VENDOR":
      return {
        ...state,
        vendors: state.vendors.filter((v) => v._id !== action.id),
        transactions: state.transactions.filter((t) => t.vendorId !== action.id),
      };
    case "ADD_TRANSACTION": {
      const tx: Transaction = { _id: genId(), ...action.transaction };
      const vendors = state.vendors.map((v) => {
        if (v._id !== action.transaction.vendorId) return v;
        const delta = action.transaction.type === "bill" ? action.transaction.amount : -action.transaction.amount;
        return { ...v, dueAmount: Math.max(0, v.dueAmount + delta), lastTransaction: action.transaction.date, daysOverdue: 0 };
      });
      return { ...state, transactions: [tx, ...state.transactions], vendors };
    }
    case "UPDATE_TRANSACTION":
      return { ...state, transactions: state.transactions.map((t) => (t._id === action.transaction._id ? action.transaction : t)) };
    case "DELETE_TRANSACTION": {
      const tx = state.transactions.find((t) => t._id === action.id);
      if (!tx) return state;
      const vendors = state.vendors.map((v) => {
        if (v._id !== tx.vendorId) return v;
        const delta = tx.type === "bill" ? -tx.amount : tx.amount;
        return { ...v, dueAmount: Math.max(0, v.dueAmount + delta) };
      });
      return { ...state, transactions: state.transactions.filter((t) => t._id !== action.id), vendors };
    }
    case "ADD_PRODUCT":
      return { ...state, products: [...state.products, { _id: genId(), ...action.product }] };
    case "UPDATE_PRODUCT":
      return { ...state, products: state.products.map((p) => (p._id === action.product._id ? action.product : p)) };
    case "DELETE_PRODUCT":
      return { ...state, products: state.products.filter((p) => p._id !== action.id) };
    case "ADD_SUPPLIER": {
      const s: Supplier = {
        _id: genId(),
        avatar: getInitials(action.supplier.name),
        totalPurchases: 0,
        totalPaid: 0,
        balanceDue: 0,
        lastPurchase: new Date().toISOString(),
        ...action.supplier,
      };
      return { ...state, suppliers: [...state.suppliers, s] };
    }
    case "ADD_SUPPLIER_TRANSACTION": {
      const tx: SupplierTransaction = { _id: genId(), ...action.tx };
      const suppliers = state.suppliers.map((s) => {
        if (s._id !== action.tx.supplierId) return s;
        const isPurchase = action.tx.type === "purchase";
        return {
          ...s,
          balanceDue: Math.max(0, s.balanceDue + (isPurchase ? action.tx.amount : -action.tx.amount)),
          totalPurchases: isPurchase ? s.totalPurchases + action.tx.amount : s.totalPurchases,
          totalPaid: !isPurchase ? s.totalPaid + action.tx.amount : s.totalPaid,
          lastPurchase: action.tx.date,
        };
      });
      return { ...state, supplierTransactions: [tx, ...state.supplierTransactions], suppliers };
    }
    case "DELETE_SUPPLIER_TRANSACTION": {
      const tx = state.supplierTransactions.find((t) => t._id === action.id);
      if (!tx) return state;
      const suppliers = state.suppliers.map((s) => {
        if (s._id !== tx.supplierId) return s;
        const isPurchase = tx.type === "purchase";
        return {
          ...s,
          balanceDue: Math.max(0, s.balanceDue + (isPurchase ? -tx.amount : tx.amount)),
          totalPurchases: isPurchase ? s.totalPurchases - tx.amount : s.totalPurchases,
          totalPaid: !isPurchase ? s.totalPaid - tx.amount : s.totalPaid,
        };
      });
      return { ...state, supplierTransactions: state.supplierTransactions.filter((t) => t._id !== action.id), suppliers };
    }
    default:
      return state;
  }
}

// ============================================================
// Persistence
// ============================================================

const STORAGE_KEY = "arasi_cafe_v1";

function loadState(): StoreData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { supplierTransactions: SEED_SUPPLIER_TRANSACTIONS, ...parsed };
    }
  } catch {}
  return { vendors: SEED_VENDORS, transactions: SEED_TRANSACTIONS, products: SEED_PRODUCTS, suppliers: SEED_SUPPLIERS, supplierTransactions: SEED_SUPPLIER_TRANSACTIONS };
}

// ============================================================
// Module-level singleton store (no React Context — avoids
// "multiple renderers" crash in Figma Make preview)
// ============================================================

let _state: StoreData = loadState();
const _listeners = new Set<() => void>();

function _notify() {
  _listeners.forEach((fn) => fn());
}

export function dispatch(action: Action): void {
  _state = reducer(_state, action);
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(_state)); } catch {}
  _notify();
}

export function useStore() {
  const [, rerender] = useState(0);
  useEffect(() => {
    const fn = () => rerender((n) => n + 1);
    _listeners.add(fn);
    return () => { _listeners.delete(fn); };
  }, []);
  return { state: _state, dispatch };
}


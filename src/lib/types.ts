export type PaymentMethod = "cash" | "udhaar";
export type PaymentStatus = "paid" | "partial" | "unpaid";
export type ProductKind = "product" | "service";

export type ExpenseCategory =
  | "Rent"
  | "Electricity"
  | "Salaries"
  | "Transport"
  | "Supplies"
  | "Maintenance"
  | "Marketing"
  | "Utilities"
  | "Other";

export type ExpensePaymentMethod = "cash" | "card" | "transfer" | "other";

export interface Product {
  id: string;
  name: string;
  category: string;
  kind: ProductKind;
  costPrice: number;
  salePrice: number;
  stock: number; // only meaningful for kind === "product"
  lowStockThreshold: number;
}

export interface SaleItem {
  productId: string;
  productName: string;
  qty: number;
  unitPrice: number;
}

export interface Sale {
  id: string;
  invoiceNo: number;
  date: string; // ISO
  items: SaleItem[];
  total: number;
  cost: number; // cost of goods sold, for profit
  customerId?: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paidAmount: number;
  notes?: string;
}

export interface Expense {
  id: string;
  date: string;
  category: ExpenseCategory;
  amount: number;
  note: string;
  paymentMethod: ExpensePaymentMethod;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  openingBalance: number; // udhaar carried in before tracking
  lastVisit: string;
}

export type DocumentCategory = "receipt" | "invoice" | "expense-bill" | "purchase-bill";

export interface Document {
  id: string;
  category: DocumentCategory;
  title: string;
  date: string; // ISO
  fileName: string;
  fileType: string;
  fileSize: number;
  fileData: string; // base64
  note?: string;
  relatedSaleId?: string;
  relatedExpenseId?: string;
}

export interface BusinessData {
  businessName: string;
  ownerName: string;
  currency: string;
  seedDate: string; // yyyy-mm-dd the data was generated for
  products: Product[];
  sales: Sale[];
  expenses: Expense[];
  customers: Customer[];
  documents: Document[];
}

export type Language = "en" | "ur" | "roman";
export type ViewMode = "simple" | "professional";

export interface AppSettings {
  language: Language;
  mode: ViewMode;
}

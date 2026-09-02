import type {
  BusinessData,
  Customer,
  Document,
  Expense,
  ExpenseCategory,
  Product,
  Sale,
  SaleItem,
} from "./types";

// Generic categories suitable for any small business, not just grocery.
export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  "Rent",
  "Electricity",
  "Salaries",
  "Transport",
  "Supplies",
  "Maintenance",
  "Marketing",
  "Utilities",
  "Other",
];

export interface SaleInput {
  date: string;
  items: SaleItem[];
  customerId?: string;
  paymentMethod: Sale["paymentMethod"];
  paymentStatus: Sale["paymentStatus"];
  paidAmount: number;
  notes?: string;
}

export type MutResult<T> =
  | { ok: true; data: BusinessData; value: T }
  | { ok: false; data: BusinessData; error: string };

function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

// ---------- Selectors ----------

export function saleOutstanding(sale: Sale): number {
  return Math.max(0, sale.total - sale.paidAmount);
}

export function customerOutstanding(customer: Customer, sales: Sale[]): number {
  const fromSales = sales
    .filter((s) => s.customerId === customer.id)
    .reduce((a, s) => a + saleOutstanding(s), 0);
  return customer.openingBalance + fromSales;
}

export interface CustomerStats {
  totalPurchases: number;
  transactions: number;
  outstanding: number;
  lastPurchase: string | null;
}

export function customerStats(customer: Customer, sales: Sale[]): CustomerStats {
  const own = sales.filter((s) => s.customerId === customer.id);
  const totalPurchases = own.reduce((a, s) => a + s.total, 0);
  const lastPurchase = own.length
    ? own.reduce((m, s) => (s.date > m ? s.date : m), own[0].date)
    : null;
  return {
    totalPurchases,
    transactions: own.length,
    outstanding: customerOutstanding(customer, sales),
    lastPurchase,
  };
}

export function isLowStock(p: Product): boolean {
  return p.kind === "product" && p.stock <= p.lowStockThreshold;
}

export function isService(p: Product): boolean {
  return p.kind === "service";
}

// ---------- Totals & stock ----------

function computeTotals(data: BusinessData, items: SaleItem[]) {
  let total = 0;
  let cost = 0;
  for (const item of items) {
    total += item.unitPrice * item.qty;
    const product = data.products.find((p) => p.id === item.productId);
    cost += (product?.costPrice ?? 0) * item.qty;
  }
  return { total, cost };
}

// Returns an error message if any stock-tracked item exceeds available stock.
// excludeSale: when editing, the original sale whose stock is being released first.
export function stockError(
  data: BusinessData,
  items: SaleItem[],
  excludeSale?: Sale,
): string | null {
  for (const item of items) {
    const product = data.products.find((p) => p.id === item.productId);
    if (!product || product.kind !== "product") continue;
    const released = excludeSale
      ? excludeSale.items
          .filter((i) => i.productId === item.productId)
          .reduce((a, i) => a + i.qty, 0)
      : 0;
    const available = product.stock + released;
    if (item.qty > available) {
      return `Not enough stock for ${product.name} (available ${available}).`;
    }
  }
  return null;
}

function adjustStock(products: Product[], items: SaleItem[], sign: 1 | -1): Product[] {
  return products.map((p) => {
    if (p.kind !== "product") return p;
    const qty = items
      .filter((i) => i.productId === p.id)
      .reduce((a, i) => a + i.qty, 0);
    if (!qty) return p;
    return { ...p, stock: Math.max(0, p.stock + sign * qty) };
  });
}

function nextInvoiceNo(data: BusinessData): number {
  return data.sales.reduce((m, s) => Math.max(m, s.invoiceNo), 1000) + 1;
}

// ---------- Sale mutations ----------

export function createSale(data: BusinessData, input: SaleInput): MutResult<Sale> {
  if (!input.items.length) return { ok: false, data, error: "Add at least one item." };
  const err = stockError(data, input.items);
  if (err) return { ok: false, data, error: err };

  const { total, cost } = computeTotals(data, input.items);
  const sale: Sale = {
    id: uid("s"),
    invoiceNo: nextInvoiceNo(data),
    total,
    cost,
    ...input,
  };
  const products = adjustStock(data.products, input.items, -1);
  const customers = touchCustomer(data.customers, input.customerId, input.date);
  return {
    ok: true,
    value: sale,
    data: { ...data, products, customers, sales: [sale, ...data.sales] },
  };
}

export function updateSale(
  data: BusinessData,
  id: string,
  input: SaleInput,
): MutResult<Sale> {
  const old = data.sales.find((s) => s.id === id);
  if (!old) return { ok: false, data, error: "Sale not found." };
  if (!input.items.length) return { ok: false, data, error: "Add at least one item." };

  const err = stockError(data, input.items, old);
  if (err) return { ok: false, data, error: err };

  const { total, cost } = computeTotals(data, input.items);
  const sale: Sale = { ...old, ...input, total, cost };
  let products = adjustStock(data.products, old.items, 1); // release old
  products = adjustStock(products, input.items, -1); // apply new
  const customers = touchCustomer(data.customers, input.customerId, input.date);
  return {
    ok: true,
    value: sale,
    data: {
      ...data,
      products,
      customers,
      sales: data.sales.map((s) => (s.id === id ? sale : s)),
    },
  };
}

export function deleteSale(data: BusinessData, id: string): MutResult<null> {
  const old = data.sales.find((s) => s.id === id);
  if (!old) return { ok: false, data, error: "Sale not found." };
  const products = adjustStock(data.products, old.items, 1);
  return {
    ok: true,
    value: null,
    data: { ...data, products, sales: data.sales.filter((s) => s.id !== id) },
  };
}

function touchCustomer(
  customers: Customer[],
  customerId: string | undefined,
  date: string,
): Customer[] {
  if (!customerId) return customers;
  return customers.map((c) => (c.id === customerId ? { ...c, lastVisit: date.slice(0, 10) } : c));
}

// ---------- Expense mutations ----------

export type ExpenseInput = Omit<Expense, "id">;

export function addExpense(data: BusinessData, input: ExpenseInput): MutResult<Expense> {
  const expense: Expense = { id: uid("e"), ...input };
  return { ok: true, value: expense, data: { ...data, expenses: [expense, ...data.expenses] } };
}

export function updateExpense(
  data: BusinessData,
  id: string,
  input: ExpenseInput,
): MutResult<Expense> {
  const expense: Expense = { id, ...input };
  return {
    ok: true,
    value: expense,
    data: { ...data, expenses: data.expenses.map((e) => (e.id === id ? expense : e)) },
  };
}

export function deleteExpense(data: BusinessData, id: string): MutResult<null> {
  return { ok: true, value: null, data: { ...data, expenses: data.expenses.filter((e) => e.id !== id) } };
}

// ---------- Customer mutations ----------

export type CustomerInput = Omit<Customer, "id">;

export function addCustomer(data: BusinessData, input: CustomerInput): MutResult<Customer> {
  const customer: Customer = { id: uid("c"), ...input };
  return { ok: true, value: customer, data: { ...data, customers: [...data.customers, customer] } };
}

export function updateCustomer(
  data: BusinessData,
  id: string,
  input: CustomerInput,
): MutResult<Customer> {
  const customer: Customer = { id, ...input };
  return {
    ok: true,
    value: customer,
    data: { ...data, customers: data.customers.map((c) => (c.id === id ? customer : c)) },
  };
}

// Deleting a customer keeps their sales but detaches them so history stays intact.
export function deleteCustomer(data: BusinessData, id: string): MutResult<null> {
  return {
    ok: true,
    value: null,
    data: {
      ...data,
      customers: data.customers.filter((c) => c.id !== id),
      sales: data.sales.map((s) => (s.customerId === id ? { ...s, customerId: undefined } : s)),
    },
  };
}

// ---------- Product mutations ----------

export type ProductInput = Omit<Product, "id">;

export function addProduct(data: BusinessData, input: ProductInput): MutResult<Product> {
  const product: Product = { id: uid("p"), ...input };
  return { ok: true, value: product, data: { ...data, products: [...data.products, product] } };
}

export function updateProduct(
  data: BusinessData,
  id: string,
  input: ProductInput,
): MutResult<Product> {
  const product: Product = { id, ...input };
  return {
    ok: true,
    value: product,
    data: { ...data, products: data.products.map((p) => (p.id === id ? product : p)) },
  };
}

export function deleteProduct(data: BusinessData, id: string): MutResult<null> {
  return { ok: true, value: null, data: { ...data, products: data.products.filter((p) => p.id !== id) } };
}

// ---------- Document mutations ----------

export type DocumentInput = Omit<Document, "id">;

export function addDocument(data: BusinessData, input: DocumentInput): MutResult<Document> {
  const doc: Document = { id: uid("d"), ...input };
  return { ok: true, value: doc, data: { ...data, documents: [doc, ...data.documents] } };
}

export function updateDocument(
  data: BusinessData,
  id: string,
  input: DocumentInput,
): MutResult<Document> {
  const doc: Document = { id, ...input };
  return {
    ok: true,
    value: doc,
    data: { ...data, documents: data.documents.map((d) => (d.id === id ? doc : d)) },
  };
}

export function deleteDocument(data: BusinessData, id: string): MutResult<null> {
  return { ok: true, value: null, data: { ...data, documents: data.documents.filter((d) => d.id !== id) } };
}

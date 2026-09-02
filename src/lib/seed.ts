import type {
  BusinessData,
  Customer,
  Expense,
  ExpenseCategory,
  Product,
  Sale,
  SaleItem,
} from "./types";
import { daysAgoISO, todayISO } from "./format";

// Deterministic PRNG so demo data is stable for a given day.
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const PRODUCTS: Omit<Product, "id">[] = [
  { name: "Atta (Flour) 20kg", category: "Staples", kind: "product", costPrice: 2400, salePrice: 3100, stock: 18, lowStockThreshold: 8 },
  { name: "Cheeni (Sugar) 1kg", category: "Staples", kind: "product", costPrice: 150, salePrice: 200, stock: 45, lowStockThreshold: 20 },
  { name: "Basmati Chawal 5kg", category: "Staples", kind: "product", costPrice: 1250, salePrice: 1650, stock: 12, lowStockThreshold: 6 },
  { name: "Cooking Oil 5L", category: "Staples", kind: "product", costPrice: 2450, salePrice: 3200, stock: 10, lowStockThreshold: 5 },
  { name: "Chai Patti 950g", category: "Beverages", kind: "product", costPrice: 950, salePrice: 1250, stock: 22, lowStockThreshold: 10 },
  { name: "Doodh Pack 1L", category: "Dairy", kind: "product", costPrice: 220, salePrice: 290, stock: 40, lowStockThreshold: 24 },
  { name: "Anday (Dozen)", category: "Dairy", kind: "product", costPrice: 320, salePrice: 420, stock: 25, lowStockThreshold: 12 },
  { name: "Sabun Bar", category: "Household", kind: "product", costPrice: 120, salePrice: 160, stock: 60, lowStockThreshold: 25 },
  { name: "Shampoo Sachet", category: "Household", kind: "product", costPrice: 15, salePrice: 20, stock: 200, lowStockThreshold: 80 },
  { name: "Biscuits Family Pack", category: "Snacks", kind: "product", costPrice: 60, salePrice: 80, stock: 90, lowStockThreshold: 40 },
  { name: "Soft Drink 1.5L", category: "Beverages", kind: "product", costPrice: 180, salePrice: 240, stock: 30, lowStockThreshold: 15 },
  { name: "Dishwash Liquid", category: "Household", kind: "product", costPrice: 250, salePrice: 330, stock: 18, lowStockThreshold: 8 },
  { name: "Masala Mix", category: "Staples", kind: "product", costPrice: 90, salePrice: 120, stock: 50, lowStockThreshold: 20 },
  { name: "Daal Chana 1kg", category: "Staples", kind: "product", costPrice: 380, salePrice: 500, stock: 28, lowStockThreshold: 12 },
  { name: "Ghee 1kg", category: "Staples", kind: "product", costPrice: 620, salePrice: 820, stock: 15, lowStockThreshold: 8 },
  { name: "Home Delivery (Local)", category: "Services", kind: "service", costPrice: 0, salePrice: 150, stock: 0, lowStockThreshold: 0 },
];

const CUSTOMER_SEED: Omit<Customer, "id">[] = [
  { name: "Rashid Khan", phone: "0300-1234567", openingBalance: 4500, lastVisit: daysAgoISO(1) },
  { name: "Imran Malik", phone: "0301-2345678", openingBalance: 2800, lastVisit: daysAgoISO(2) },
  { name: "Ayesha Bibi", phone: "0302-3456789", openingBalance: 0, lastVisit: daysAgoISO(0) },
  { name: "Shahid Iqbal", phone: "0303-4567890", openingBalance: 1200, lastVisit: daysAgoISO(4) },
  { name: "Nasreen Akhtar", phone: "0304-5678901", openingBalance: 0, lastVisit: daysAgoISO(1) },
  { name: "Bilal Ahmed", phone: "0305-6789012", openingBalance: 6200, lastVisit: daysAgoISO(6) },
  { name: "Farzana Kausar", phone: "0306-7890123", openingBalance: 850, lastVisit: daysAgoISO(3) },
  { name: "Tariq Javed", phone: "0307-8901234", openingBalance: 3100, lastVisit: daysAgoISO(5) },
];

const EXPENSE_NOTES: Record<ExpenseCategory, string[]> = {
  Rent: ["Monthly shop rent"],
  Electricity: ["Electricity bill"],
  Salaries: ["Staff salary", "Helper wages"],
  Transport: ["Stock pickup rickshaw", "Delivery fuel"],
  Supplies: ["Shopping bags", "Packaging material"],
  Maintenance: ["Shop maintenance", "Shelf repair"],
  Marketing: ["Poster printing", "Sign board"],
  Utilities: ["Gas bill", "Water bill"],
  Other: ["Staff chai & snacks", "Miscellaneous"],
};

export function generateBusinessData(): BusinessData {
  const today = todayISO();
  const rand = mulberry32(hashString(`munshi-${today}`));

  const products: Product[] = PRODUCTS.map((p, i) => ({ ...p, id: `p-${i + 1}` }));
  const customers: Customer[] = CUSTOMER_SEED.map((c, i) => ({ ...c, id: `c-${i + 1}` }));

  const sales: Sale[] = [];
  const expenses: Expense[] = [];
  let saleSeq = 1;
  let invoice = 1001;
  let expenseSeq = 1;

  for (let back = 29; back >= 0; back--) {
    const iso = daysAgoISO(back);
    const date = new Date(`${iso}T00:00:00`);
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const txCount = Math.floor(rand() * (isWeekend ? 12 : 9)) + (isWeekend ? 14 : 10);

    for (let t = 0; t < txCount; t++) {
      const itemCount = Math.floor(rand() * 3) + 1;
      const items: SaleItem[] = [];
      let total = 0;
      let cost = 0;
      const used = new Set<number>();
      for (let k = 0; k < itemCount; k++) {
        let idx = Math.floor(rand() * products.length);
        if (used.has(idx)) idx = (idx + 1) % products.length;
        used.add(idx);
        const p = products[idx];
        const qty = Math.floor(rand() * 3) + 1;
        total += p.salePrice * qty;
        cost += p.costPrice * qty;
        items.push({ productId: p.id, productName: p.name, qty, unitPrice: p.salePrice });
      }
      const isUdhaar = rand() < 0.25;
      const settled = !isUdhaar || back > 5; // older udhaar is paid down; recent may be outstanding
      const hour = 9 + Math.floor(rand() * 12);
      const minute = Math.floor(rand() * 60);
      const timestamp = `${iso}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`;
      sales.push({
        id: `s-${saleSeq++}`,
        invoiceNo: invoice++,
        date: timestamp,
        items,
        total,
        cost,
        customerId: isUdhaar
          ? customers[Math.floor(rand() * customers.length)].id
          : undefined,
        paymentMethod: isUdhaar ? "udhaar" : "cash",
        paymentStatus: settled ? "paid" : "unpaid",
        paidAmount: settled ? total : 0,
      });
    }

    const dailyCategories: ExpenseCategory[] = ["Other", "Transport", "Supplies"];
    const smallCount = Math.floor(rand() * 2) + 1;
    for (let e = 0; e < smallCount; e++) {
      const category = dailyCategories[Math.floor(rand() * dailyCategories.length)];
      const amount = Math.round((rand() * 600 + 150) / 10) * 10;
      const notes = EXPENSE_NOTES[category];
      expenses.push({
        id: `e-${expenseSeq++}`,
        date: `${iso}T13:00:00`,
        category,
        amount,
        note: notes[Math.floor(rand() * notes.length)],
        paymentMethod: "cash",
      });
    }

    const dayOfMonth = date.getDate();
    if (dayOfMonth === 1) {
      expenses.push(
        { id: `e-${expenseSeq++}`, date: `${iso}T10:00:00`, category: "Rent", amount: 45000, note: EXPENSE_NOTES.Rent[0], paymentMethod: "cash" },
        { id: `e-${expenseSeq++}`, date: `${iso}T11:00:00`, category: "Salaries", amount: 38000, note: EXPENSE_NOTES.Salaries[0], paymentMethod: "cash" },
      );
    }
    if (dayOfMonth === 5) {
      expenses.push({
        id: `e-${expenseSeq++}`,
        date: `${iso}T12:00:00`,
        category: "Utilities",
        amount: Math.round((rand() * 6000 + 9000) / 100) * 100,
        note: EXPENSE_NOTES.Utilities[Math.floor(rand() * EXPENSE_NOTES.Utilities.length)],
        paymentMethod: "cash",
      });
    }
  }

  return {
    businessName: "Karim General Store",
    ownerName: "Karim Sahab",
    currency: "PKR",
    seedDate: today,
    products,
    sales,
    expenses,
    customers,
    documents: [],
  };
}

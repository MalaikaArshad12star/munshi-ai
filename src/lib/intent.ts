export type Intent =
  | "overview"
  | "sales"
  | "profit"
  | "expenses"
  | "customers"
  | "inventory"
  | "udhaar"
  | "recommendation"
  | "forecast"
  | "greeting"
  | "fallback";

// Keyword sets across English, Roman Urdu and Urdu script.
const K: Record<Exclude<Intent, "fallback">, string[]> = {
  greeting: ["hello", "salam", "assalam", "سلام", "ہیلو"],
  forecast: ["forecast", "next week", "next 7", "predict", "future", "اگلے ہفتے", "پیش گوئی", "agle hafte"],
  recommendation: ["should", "focus", "advice", "recommend", "what to do", "مشورہ", "کیا کروں", "kya karoon", "focus"],
  udhaar: ["udhaar", "udhar", "credit", "outstanding", "owe", "owes", "due", "ادھار", "بقایا", "kis ke paas"],
  sales: ["sale", "sales", "selling", "revenue", "sell", "سیلز", "فروخت", "sales kaisi", "meri sales"],
  profit: ["profit", "loss", "margin", "kamai", "munafa", "منافع", "کمائی", "munafa kitna", "profitable"],
  expenses: ["expense", "expenses", "spending", "spend", "cost", "kharcha", "kharchay", "اخراجات", "خرچ", "expenses high"],
  customers: ["customer", "client", "buyer", "گاہک", "grahak", "best customer"],
  inventory: ["stock", "inventory", "product", "item", "low stock", "اسٹاک", "چیز", "cheez", "not selling", "selling fast"],
  overview: ["business", "how is", "how are", "summary", "health", "doing", "کاروبار", "business kaisa", "meri business", "kaisi chal"],
};

const ORDER: Exclude<Intent, "fallback">[] = [
  "greeting",
  "forecast",
  "recommendation",
  "udhaar",
  "sales",
  "profit",
  "expenses",
  "customers",
  "inventory",
  "overview",
];

export function classifyIntent(question: string): Intent {
  const q = ` ${question.toLowerCase().trim()} `;
  for (const intent of ORDER) {
    if (K[intent].some((k) => q.includes(k.toLowerCase()))) return intent;
  }
  return "fallback";
}

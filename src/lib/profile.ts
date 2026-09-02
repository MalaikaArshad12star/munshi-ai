import type { BusinessData, Language } from "./types";

export type BusinessModel = "products" | "services" | "both";
export type BusinessMode = "demo" | "personal";

export interface BusinessProfile {
  ownerName: string;
  businessName: string;
  businessType: string;
  businessModel: BusinessModel;
  language: Language;
  currency: string;
  mode: BusinessMode;
}

export const BUSINESS_TYPES = [
  "General Store",
  "Clothing & Fashion",
  "Restaurant / Food",
  "Beauty / Cosmetics",
  "Salon / Beauty Services",
  "Pharmacy",
  "Mobile & Electronics",
  "Hardware",
  "Home Business",
  "Service Business",
  "Other",
];

// Suggested category labels per business type (for future labels/suggestions only).
export const BUSINESS_TYPE_CATEGORIES: Record<string, string[]> = {
  "General Store": ["Groceries", "Beverages", "Household", "Snacks"],
  "Clothing & Fashion": ["Men's Clothing", "Women's Clothing", "Kids", "Accessories"],
  "Restaurant / Food": ["Main Dishes", "Drinks", "Desserts", "Snacks"],
  "Beauty / Cosmetics": ["Skincare", "Makeup", "Haircare"],
  "Salon / Beauty Services": ["Haircut", "Styling", "Facial", "Makeup"],
  Pharmacy: ["Medicine", "Personal Care", "Health Products"],
  "Mobile & Electronics": ["Smartphones", "Accessories", "Electronics", "Repairs"],
  Hardware: ["Tools", "Construction", "Electrical", "Plumbing"],
  "Home Business": ["Products", "Services", "Other"],
  "Service Business": ["Professional Services", "Consulting", "Repairs", "Other"],
  Other: ["Products", "Services", "Other"],
};

export const CURRENCIES = ["PKR", "INR", "USD", "AED", "SAR", "GBP"];

const PROFILE_KEY = "munshi-ai:profile:v1";

export function demoProfile(): BusinessProfile {
  return {
    ownerName: "Karim Sahab",
    businessName: "Karim General Store",
    businessType: "General Store",
    businessModel: "products",
    language: "en",
    currency: "PKR",
    mode: "demo",
  };
}

export function loadProfile(): BusinessProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PROFILE_KEY);
    if (raw) return { ...demoProfile(), ...JSON.parse(raw) };
  } catch {
    // ignore
  }
  return null;
}

export function saveProfile(profile: BusinessProfile): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // ignore
  }
}

// A fresh personalized business starts EMPTY — no Karim grocery data.
export function emptyPersonalData(p: BusinessProfile): BusinessData {
  return {
    businessName: p.businessName,
    ownerName: p.ownerName,
    currency: p.currency,
    seedDate: "personal",
    products: [],
    sales: [],
    expenses: [],
    customers: [],
    documents: [],
  };
}

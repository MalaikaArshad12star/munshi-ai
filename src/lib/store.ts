import type { BusinessData } from "./types";
import { generateBusinessData } from "./seed";
import { emptyPersonalData, type BusinessProfile } from "./profile";
import { todayISO } from "./format";

const DATA_KEY = "munshi-ai:data:v4";
const PERSONAL_KEY = "munshi-ai:data:personal:v1";

export function loadBusinessData(): BusinessData {
  if (typeof window === "undefined") {
    return generateBusinessData();
  }
  try {
    const raw = window.localStorage.getItem(DATA_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as BusinessData;
      // Re-seed on a new day so "today" always has fresh activity.
      if (parsed && parsed.seedDate === todayISO()) {
        return parsed;
      }
    }
  } catch {
    // fall through to regenerate
  }
  const data = generateBusinessData();
  saveBusinessData(data);
  return data;
}

export function saveBusinessData(data: BusinessData): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DATA_KEY, JSON.stringify(data));
  } catch {
    // storage may be unavailable; ignore for demo purposes
  }
}

export function resetBusinessData(): BusinessData {
  const data = generateBusinessData();
  saveBusinessData(data);
  return data;
}

// ---- Personalized business data (never re-seeded; user-owned) ----

export function loadPersonalData(profile: BusinessProfile): BusinessData {
  if (typeof window === "undefined") return emptyPersonalData(profile);
  try {
    const raw = window.localStorage.getItem(PERSONAL_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as BusinessData;
      if (parsed) {
        // Keep identity in sync with the profile without touching records.
        return {
          ...parsed,
          businessName: profile.businessName,
          ownerName: profile.ownerName,
          currency: profile.currency,
        };
      }
    }
  } catch {
    // fall through to create empty
  }
  const data = emptyPersonalData(profile);
  savePersonalData(data);
  return data;
}

export function savePersonalData(data: BusinessData): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PERSONAL_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

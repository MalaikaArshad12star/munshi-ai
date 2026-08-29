import type { BusinessData } from "./types";
import { generateBusinessData } from "./seed";
import { todayISO } from "./format";

const DATA_KEY = "munshi-ai:data:v4";

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

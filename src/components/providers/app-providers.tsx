"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { AppSettings, BusinessData, Language, ViewMode } from "@/lib/types";
import { loadBusinessData, saveBusinessData, loadPersonalData, savePersonalData } from "@/lib/store";
import { loadProfile, saveProfile, demoProfile, type BusinessProfile, type BusinessMode } from "@/lib/profile";
import { computeKpis, type Kpis } from "@/lib/kpis";
import { translate } from "@/lib/i18n";
import {
  addCustomer,
  addDocument,
  addExpense,
  addProduct,
  createSale,
  deleteCustomer,
  deleteDocument,
  deleteExpense,
  deleteProduct,
  deleteSale,
  updateCustomer,
  updateDocument,
  updateExpense,
  updateProduct,
  updateSale,
  type CustomerInput,
  type DocumentInput,
  type ExpenseInput,
  type MutResult,
  type ProductInput,
  type SaleInput,
} from "@/lib/business";
import { ToastProvider } from "@/components/ui/toast";

const SETTINGS_KEY = "munshi-ai:settings:v1";

export interface BusinessActions {
  addSale: (i: SaleInput) => MutResult<BusinessData["sales"][number]>;
  updateSale: (id: string, i: SaleInput) => MutResult<BusinessData["sales"][number]>;
  deleteSale: (id: string) => MutResult<null>;
  addExpense: (i: ExpenseInput) => MutResult<BusinessData["expenses"][number]>;
  updateExpense: (id: string, i: ExpenseInput) => MutResult<BusinessData["expenses"][number]>;
  deleteExpense: (id: string) => MutResult<null>;
  addCustomer: (i: CustomerInput) => MutResult<BusinessData["customers"][number]>;
  updateCustomer: (id: string, i: CustomerInput) => MutResult<BusinessData["customers"][number]>;
  deleteCustomer: (id: string) => MutResult<null>;
  addProduct: (i: ProductInput) => MutResult<BusinessData["products"][number]>;
  updateProduct: (id: string, i: ProductInput) => MutResult<BusinessData["products"][number]>;
  deleteProduct: (id: string) => MutResult<null>;
  addDocument: (i: DocumentInput) => MutResult<BusinessData["documents"][number]>;
  updateDocument: (id: string, i: DocumentInput) => MutResult<BusinessData["documents"][number]>;
  deleteDocument: (id: string) => MutResult<null>;
}

interface AppContextValue {
  mounted: boolean;
  settings: AppSettings;
  setLanguage: (lang: Language) => void;
  setMode: (mode: ViewMode) => void;
  t: (key: string) => string;
  profile: BusinessProfile | null;
  setProfile: (p: BusinessProfile) => void;
  switchMode: (mode: BusinessMode) => void;
  data: BusinessData | null;
  kpis: Kpis | null;
  actions: BusinessActions;
}

const AppContext = createContext<AppContextValue | null>(null);

const DEFAULT_SETTINGS: AppSettings = { language: "en", mode: "professional" };

function readSettings(): AppSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    // keep defaults
  }
  return DEFAULT_SETTINGS;
}

function dataForProfile(p: BusinessProfile | null): BusinessData | null {
  if (typeof window === "undefined" || !p) return null;
  return p.mode === "demo" ? loadBusinessData() : loadPersonalData(p);
}

export function AppProviders({ children }: { children: ReactNode }) {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const [settings, setSettings] = useState<AppSettings>(readSettings);
  const [profile, setProfileState] = useState<BusinessProfile | null>(() =>
    typeof window === "undefined" ? null : loadProfile(),
  );
  const [data, setData] = useState<BusinessData | null>(() =>
    dataForProfile(typeof window === "undefined" ? null : loadProfile()),
  );

  const persistSettings = useCallback((next: AppSettings) => {
    setSettings(next);
    try {
      window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }, []);

  const setLanguage = useCallback(
    (language: Language) => persistSettings({ ...settings, language }),
    [persistSettings, settings],
  );
  const setMode = useCallback(
    (mode: ViewMode) => persistSettings({ ...settings, mode }),
    [persistSettings, settings],
  );

  const setProfile = useCallback(
    (next: BusinessProfile) => {
      saveProfile(next);
      setProfileState(next);
      setData(dataForProfile(next));
      persistSettings({ ...settings, language: next.language });
    },
    [persistSettings, settings],
  );

  const switchMode = useCallback(
    (mode: BusinessMode) => {
      const base = profile ?? demoProfile();
      setProfile({ ...base, mode });
    },
    [profile, setProfile],
  );

  const t = useCallback((key: string) => translate(settings.language, key), [settings.language]);

  const kpis = useMemo(() => (data ? computeKpis(data) : null), [data]);

  const actions = useMemo<BusinessActions>(() => {
    const commit = <T,>(r: MutResult<T>): MutResult<T> => {
      if (r.ok) {
        setData(r.data);
        if (profile?.mode === "personal") savePersonalData(r.data);
        else saveBusinessData(r.data);
      }
      return r;
    };
    const base = data as BusinessData;
    return {
      addSale: (i) => commit(createSale(base, i)),
      updateSale: (id, i) => commit(updateSale(base, id, i)),
      deleteSale: (id) => commit(deleteSale(base, id)),
      addExpense: (i) => commit(addExpense(base, i)),
      updateExpense: (id, i) => commit(updateExpense(base, id, i)),
      deleteExpense: (id) => commit(deleteExpense(base, id)),
      addCustomer: (i) => commit(addCustomer(base, i)),
      updateCustomer: (id, i) => commit(updateCustomer(base, id, i)),
      deleteCustomer: (id) => commit(deleteCustomer(base, id)),
      addProduct: (i) => commit(addProduct(base, i)),
      updateProduct: (id, i) => commit(updateProduct(base, id, i)),
      deleteProduct: (id) => commit(deleteProduct(base, id)),
      addDocument: (i) => commit(addDocument(base, i)),
      updateDocument: (id, i) => commit(updateDocument(base, id, i)),
      deleteDocument: (id) => commit(deleteDocument(base, id)),
    };
  }, [data, profile]);

  const value = useMemo<AppContextValue>(
    () => ({ mounted, settings, setLanguage, setMode, t, profile, setProfile, switchMode, data, kpis, actions }),
    [mounted, settings, setLanguage, setMode, t, profile, setProfile, switchMode, data, kpis, actions],
  );

  return (
    <AppContext.Provider value={value}>
      <ToastProvider>{children}</ToastProvider>
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProviders");
  return ctx;
}

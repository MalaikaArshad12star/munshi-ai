"use client";

import { useState } from "react";
import { Sparkles, Store } from "lucide-react";
import { useApp } from "@/components/providers/app-providers";
import { Button, Field, Input, Select } from "@/components/ui/kit";
import { MunshiLogo } from "@/components/layout/logo";
import {
  BUSINESS_TYPES,
  CURRENCIES,
  demoProfile,
  type BusinessModel,
  type BusinessProfile,
} from "@/lib/profile";
import type { Language } from "@/lib/types";

export function BusinessSetup() {
  const { setProfile } = useApp();

  const [ownerName, setOwnerName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState(BUSINESS_TYPES[0]);
  const [businessModel, setBusinessModel] = useState<BusinessModel>("products");
  const [language, setLanguage] = useState<Language>("en");
  const [currency, setCurrency] = useState("PKR");
  const [error, setError] = useState("");

  const createMine = () => {
    if (!ownerName.trim() || !businessName.trim()) {
      setError("Please enter your name and business name.");
      return;
    }
    const profile: BusinessProfile = {
      ownerName: ownerName.trim(),
      businessName: businessName.trim(),
      businessType,
      businessModel,
      language,
      currency,
      mode: "personal",
    };
    setProfile(profile);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="mb-6 flex flex-col items-center text-center">
          <MunshiLogo className="h-14 w-14" />
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-fg">
            Welcome to Munshi <span className="text-brand-strong">AI</span>
          </h1>
          <p className="mt-1 text-sm text-muted">
            Your AI business munshi — set up your own business, or explore the demo.
          </p>
        </div>

        <div className="rounded-2xl border border-line bg-panel p-6 shadow-card">
          <div className="mb-4 flex items-center gap-2">
            <Store className="h-4 w-4 text-brand-strong" />
            <h2 className="text-sm font-bold text-fg">My Business</h2>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Owner name">
              <Input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="e.g. Malaika" />
            </Field>
            <Field label="Business name">
              <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="e.g. Malaika Boutique" />
            </Field>
            <Field label="Business type">
              <Select value={businessType} onChange={(e) => setBusinessType(e.target.value)}>
                {BUSINESS_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </Select>
            </Field>
            <Field label="You offer">
              <Select value={businessModel} onChange={(e) => setBusinessModel(e.target.value as BusinessModel)}>
                <option value="products">Products</option>
                <option value="services">Services</option>
                <option value="both">Products & Services</option>
              </Select>
            </Field>
            <Field label="Language">
              <Select value={language} onChange={(e) => setLanguage(e.target.value as Language)}>
                <option value="en">English</option>
                <option value="ur">اردو</option>
                <option value="roman">Roman Urdu</option>
              </Select>
            </Field>
            <Field label="Currency">
              <Select value={currency} onChange={(e) => setCurrency(e.target.value)}>
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
            </Field>
          </div>

          {error && <p className="mt-3 text-xs font-medium text-down">{error}</p>}

          <Button className="mt-4 w-full" onClick={createMine}>
            Create My Business
          </Button>

          <div className="my-4 flex items-center gap-3">
            <span className="h-px flex-1 bg-line" />
            <span className="text-[11px] font-semibold uppercase tracking-wide text-faint">or</span>
            <span className="h-px flex-1 bg-line" />
          </div>

          <Button variant="gold" className="w-full" onClick={() => setProfile(demoProfile())}>
            <Sparkles className="h-4 w-4" /> Explore Demo Business
          </Button>
          <p className="mt-2 text-center text-[11px] text-faint">
            Demo uses the sample “Karim General Store” data. You can switch to your own business anytime.
          </p>
        </div>
      </div>
    </div>
  );
}

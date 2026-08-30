"use client";

import { useState } from "react";
import { Building2, RefreshCw } from "lucide-react";
import { useApp } from "@/components/providers/app-providers";
import { useToast } from "@/components/ui/toast";
import { Button, Field, Input, Select } from "@/components/ui/kit";
import { Panel, PanelHeader } from "@/components/ui/panel";
import {
  BUSINESS_TYPES,
  CURRENCIES,
  type BusinessModel,
} from "@/lib/profile";
import type { Language } from "@/lib/types";
import { cn } from "@/lib/cn";

export default function SettingsPage() {
  const { profile, setProfile, switchMode, t, mounted } = useApp();
  const { toast } = useToast();

  const [ownerName, setOwnerName] = useState(profile?.ownerName ?? "");
  const [businessName, setBusinessName] = useState(profile?.businessName ?? "");
  const [businessType, setBusinessType] = useState(profile?.businessType ?? BUSINESS_TYPES[0]);
  const [businessModel, setBusinessModel] = useState<BusinessModel>(profile?.businessModel ?? "products");
  const [language, setLanguage] = useState<Language>(profile?.language ?? "en");
  const [currency, setCurrency] = useState(profile?.currency ?? "PKR");
  const [error, setError] = useState("");

  if (!mounted || !profile) return null;

  const save = () => {
    if (!ownerName.trim() || !businessName.trim()) {
      setError(t("common.required"));
      return;
    }
    setError("");
    setProfile({
      ...profile,
      ownerName: ownerName.trim(),
      businessName: businessName.trim(),
      businessType,
      businessModel,
      language,
      currency,
    });
    toast("success", "Business profile saved.");
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-fg">{t("nav.settings")}</h1>
        <p className="mt-1 text-sm text-muted">Your business profile and data mode.</p>
      </div>

      {/* Mode switch */}
      <Panel>
        <PanelHeader title="Business mode" sub="Switch without losing either dataset" />
        <div className="grid grid-cols-2 gap-2 p-4">
          <button
            type="button"
            onClick={() => switchMode("personal")}
            className={cn(
              "rounded-xl border p-3 text-left transition-colors",
              profile.mode === "personal" ? "border-brand/50 bg-brand/10" : "border-line bg-panel2 hover:border-line2",
            )}
          >
            <p className="text-sm font-bold text-fg">My Business</p>
            <p className="mt-0.5 text-[11px] text-faint">Your personalized business & data</p>
          </button>
          <button
            type="button"
            onClick={() => switchMode("demo")}
            className={cn(
              "rounded-xl border p-3 text-left transition-colors",
              profile.mode === "demo" ? "border-gold/50 bg-gold/10" : "border-line bg-panel2 hover:border-line2",
            )}
          >
            <p className="text-sm font-bold text-fg">Demo Business</p>
            <p className="mt-0.5 text-[11px] text-faint">Sample “Karim General Store” data</p>
          </button>
        </div>
      </Panel>

      {/* Profile editor */}
      <Panel>
        <PanelHeader
          title="Business Profile"
          sub={profile.mode === "demo" ? "Edits apply to My Business (demo stays Karim)" : "Used across the app"}
        />
        <div className="space-y-4 p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Owner name" >
              <Input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} />
            </Field>
            <Field label="Business name">
              <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
            </Field>
            <Field label="Business type">
              <Select value={businessType} onChange={(e) => setBusinessType(e.target.value)}>
                {BUSINESS_TYPES.map((ty) => (
                  <option key={ty} value={ty}>{ty}</option>
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
          {error && <p className="text-xs font-medium text-down">{error}</p>}
          <div className="flex justify-end">
            <Button onClick={save}>
              <Building2 className="h-4 w-4" /> {t("common.save")}
            </Button>
          </div>
        </div>
      </Panel>

      <p className="flex items-center gap-2 text-[11px] text-faint">
        <RefreshCw className="h-3.5 w-3.5" />
        Changes apply immediately across the dashboard, Munshi and reports.
      </p>
    </div>
  );
}

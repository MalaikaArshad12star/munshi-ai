"use client";

import { useState, type ReactNode } from "react";
import { Menu, Store } from "lucide-react";
import { LanguageSelector } from "./language-selector";
import { ModeToggle } from "./mode-toggle";
import { MobileSidebar, Sidebar } from "./sidebar";
import { AppProviders, useApp } from "@/components/providers/app-providers";
import { BusinessSetup } from "@/components/setup/business-setup";
import { longDateLabel } from "@/lib/format";

function TopBar({ onMenu }: { onMenu: () => void }) {
  const { data, mounted, profile } = useApp();
  const owner = profile?.ownerName ?? data?.ownerName ?? "Owner";
  const initials = owner
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-ink/85 backdrop-blur-md">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        <button
          type="button"
          onClick={onMenu}
          className="grid h-9 w-9 place-items-center rounded-xl border border-line bg-panel text-muted hover:text-fg lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-4.5 w-4.5" />
        </button>

        {/* Business identity */}
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-line bg-panel2 text-gold">
            <Store className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-fg">
              {mounted && data ? data.businessName : "Loading business…"}
            </p>
            <p className="truncate text-[11px] text-faint">
              {mounted ? longDateLabel(new Date()) : ""}
            </p>
          </div>
        </div>

        <div className="flex-1" />

        {/* Controls */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <ModeToggle />
          </div>
          <LanguageSelector />
          <div
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-gold to-amber-600 text-xs font-bold text-ink"
            title={`${owner} — Owner`}
          >
            {initials}
          </div>
        </div>
      </div>

      {/* Mode toggle surfaces here on small screens */}
      <div className="border-t border-line px-4 py-2 sm:hidden">
        <ModeToggle />
      </div>
    </header>
  );
}

function ShellGate({ children }: { children: ReactNode }) {
  const { profile } = useApp();
  const [navOpen, setNavOpen] = useState(false);

  if (!profile) return <BusinessSetup />;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <MobileSidebar open={navOpen} onClose={() => setNavOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onMenu={() => setNavOpen(true)} />
        <main className="mx-auto w-full max-w-[1240px] flex-1 px-4 py-6 sm:px-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <AppProviders>
      <ShellGate>{children}</ShellGate>
    </AppProviders>
  );
}

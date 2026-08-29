"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import { NAV_ITEMS } from "./nav-config";
import { MunshiLogo, MunshiWordmark } from "./logo";
import { useApp } from "@/components/providers/app-providers";

function BrandRow({ onClose }: { onClose?: () => void }) {
  return (
    <div className="flex items-center gap-3 px-5 pb-6 pt-6">
      <MunshiLogo />
      <MunshiWordmark className="flex-1" />
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-panel3 hover:text-fg lg:hidden"
          aria-label="Close menu"
        >
          <X className="h-4.5 w-4.5" />
        </button>
      )}
    </div>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { t, settings } = useApp();
  const urdu = settings.language === "ur";
  return (
    <nav className="flex-1 space-y-1 px-3">
      <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">
        Business
      </p>
      {NAV_ITEMS.map((item) => {
        const active =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-colors",
              active
                ? "bg-gradient-to-r from-brand/20 to-brand/5 text-fg shadow-[inset_0_0_0_1px_rgba(52,211,153,0.25)]"
                : "text-muted hover:bg-panel2 hover:text-fg",
              item.soon && !active && "opacity-60",
            )}
          >
            <span
              className={cn(
                "grid h-7 w-7 place-items-center rounded-lg transition-colors",
                active ? "bg-brand/25 text-brand-strong" : "bg-panel3 text-muted group-hover:text-fg",
              )}
            >
              <Icon className="h-4 w-4" />
            </span>
            <span className={cn("flex-1", urdu && "urdu text-sm")}>
              {t(item.tKey) || item.label}
            </span>
            {item.badge && (
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-bold",
                  item.badge === "AI"
                    ? "bg-gold/15 text-gold"
                    : "bg-panel3 text-faint",
                )}
              >
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarFooter() {
  const { kpis, mounted } = useApp();
  const score = mounted && kpis ? kpis.health.score : null;
  return (
    <div className="space-y-3 p-4">
      <div className="rounded-2xl border border-line bg-gradient-to-br from-panel2 to-panel p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-fg">Business Health</p>
          <span
            className={cn(
              "text-lg font-bold tabular",
              score === null
                ? "text-faint"
                : score >= 60
                  ? "text-brand-strong"
                  : score >= 40
                    ? "text-warn"
                    : "text-down",
            )}
          >
            {score === null ? "—" : score}
          </span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-panel3">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand to-gold transition-all duration-700"
            style={{ width: `${score ?? 0}%` }}
          />
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-faint">
          Live score from margins, trend, udhaar &amp; stock.
        </p>
      </div>
      <p className="px-1 text-center text-[10px] text-faint">
        Munshi AI · Hackathon MVP v0.1
      </p>
    </div>
  );
}

function SidebarContent({
  onClose,
  onNavigate,
}: {
  onClose?: () => void;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <BrandRow onClose={onClose} />
      <NavLinks onNavigate={onNavigate} />
      <SidebarFooter />
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-screen w-[264px] shrink-0 border-r border-line bg-panel lg:block">
      <SidebarContent />
    </aside>
  );
}

export function MobileSidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <div className={cn("fixed inset-0 z-50 lg:hidden", !open && "pointer-events-none")}>
      <div
        className={cn(
          "absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity",
          open ? "opacity-100" : "opacity-0",
        )}
        onClick={onClose}
      />
      <div
        className={cn(
          "absolute left-0 top-0 h-full w-[280px] border-r border-line bg-panel shadow-2xl transition-transform duration-300",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <SidebarContent onClose={onClose} onNavigate={onClose} />
      </div>
    </div>
  );
}

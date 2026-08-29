// Formatting helpers for currency and dates.

const nf = new Intl.NumberFormat("en-PK", { maximumFractionDigits: 0 });

export function formatPKR(amount: number): string {
  return `Rs ${nf.format(Math.round(amount))}`;
}

// Compact form for large numbers: 1234567 -> Rs 1.23M
export function formatCompact(amount: number): string {
  const abs = Math.abs(amount);
  if (abs >= 10_000_000) return `Rs ${(amount / 1_000_000).toFixed(2)}M`;
  if (abs >= 100_000) return `Rs ${(amount / 100_000).toFixed(1)}L`;
  if (abs >= 10_000) return `Rs ${(amount / 1000).toFixed(1)}k`;
  return formatPKR(amount);
}

export function formatSignedPct(pct: number): string {
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}%`;
}

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function daysAgoISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return toISODate(d);
}

export function todayISO(): string {
  return toISODate(new Date());
}

// "Wed, 18 Jun" style label for chart axes.
export function shortDateLabel(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function longDateLabel(d: Date): string {
  return d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function relativeTime(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const mins = Math.round((now - then) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

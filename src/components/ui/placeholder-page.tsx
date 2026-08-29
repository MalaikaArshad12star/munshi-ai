import Link from "next/link";
import { ArrowLeft, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export function PlaceholderPage({
  icon: Icon,
  title,
  phase,
  description,
  points,
  accent = "text-brand-strong",
}: {
  icon: LucideIcon;
  title: string;
  phase: string;
  description: string;
  points: string[];
  accent?: string;
}) {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center text-center">
      <span
        className={cn(
          "grid h-16 w-16 place-items-center rounded-2xl border border-line bg-panel shadow-card",
          accent,
        )}
      >
        <Icon className="h-7 w-7" />
      </span>
      <span className="mt-5 rounded-full bg-gold/15 px-3 py-1 text-[11px] font-bold text-gold">
        {phase}
      </span>
      <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-fg">{title}</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">{description}</p>
      <ul className="mt-6 w-full space-y-2 text-left">
        {points.map((p) => (
          <li
            key={p}
            className="flex items-center gap-2.5 rounded-xl border border-line bg-panel px-4 py-2.5 text-xs text-muted"
          >
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-strong" />
            {p}
          </li>
        ))}
      </ul>
      <Link
        href="/"
        className="mt-8 flex h-10 items-center gap-2 rounded-xl bg-gradient-to-br from-brand to-brand-deep px-5 text-xs font-bold text-white shadow-glow transition-transform hover:-translate-y-0.5"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </Link>
    </div>
  );
}

import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { SearchX } from "lucide-react";
import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost" | "gold";

const BUTTON_STYLES: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-br from-brand to-brand-deep text-white shadow-glow hover:brightness-110",
  secondary: "bg-panel3 text-fg hover:bg-line",
  danger: "bg-down/15 text-down hover:bg-down/25",
  ghost: "text-muted hover:bg-panel3 hover:text-fg",
  gold: "bg-gold/15 text-gold hover:bg-gold/25",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: "sm" | "md";
}) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-xl font-bold transition-all",
        size === "sm" ? "h-8 px-3 text-xs" : "h-10 px-4 text-sm",
        BUTTON_STYLES[variant],
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export function Field({
  label,
  error,
  hint,
  children,
  className,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-xs font-semibold text-muted">{label}</span>
      {children}
      {error ? (
        <span className="mt-1 block text-[11px] font-medium text-down">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-[11px] text-faint">{hint}</span>
      ) : null}
    </label>
  );
}

const CONTROL =
  "w-full rounded-xl border border-line bg-panel2 px-3 text-sm text-fg placeholder:text-faint focus:border-brand focus:outline-none";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(CONTROL, "h-10", className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(CONTROL, "min-h-[72px] py-2", className)} {...props} />;
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(CONTROL, "h-10 appearance-none", className)} {...props} />;
}

type BadgeTone = "up" | "down" | "warn" | "gold" | "muted" | "brand";

const BADGE_STYLES: Record<BadgeTone, string> = {
  up: "bg-up/12 text-up",
  down: "bg-down/12 text-down",
  warn: "bg-warn/12 text-warn",
  gold: "bg-gold/12 text-gold",
  muted: "bg-panel3 text-muted",
  brand: "bg-brand/12 text-brand-strong",
};

export function Badge({
  tone = "muted",
  className,
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold",
        BADGE_STYLES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function EmptyState({
  title,
  sub,
  action,
}: {
  title: string;
  sub?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-2xl border border-line bg-panel2 text-faint">
        <SearchX className="h-5 w-5" />
      </span>
      <div>
        <p className="text-sm font-bold text-fg">{title}</p>
        {sub && <p className="mt-1 text-xs text-faint">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

import { cn } from "@/lib/cn";

// Munshi AI logo: a ledger-book mark with a rising spark.
export function MunshiLogo({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative grid h-10 w-10 shrink-0 place-items-center rounded-xl",
        "bg-gradient-to-br from-brand to-brand-deep shadow-glow",
        className,
      )}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
        {/* open ledger */}
        <path
          d="M3.5 6.2c2.6-1.4 5.4-1.4 8 .2 2.6-1.6 5.4-1.6 8-.2v11.4c-2.6-1.3-5.4-1.3-8 .3-2.6-1.6-5.4-1.6-8-.3V6.2Z"
          fill="rgba(255,255,255,0.16)"
          stroke="white"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path d="M11.5 6.4v11.3" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        {/* rising spark / insight */}
        <path
          d="M14.6 13.6l2-2 1.1 1.1 2.4-2.4"
          stroke="#FFD77A"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="20.4" cy="10" r="1.3" fill="#FFD77A" />
      </svg>
      <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-gold ring-2 ring-ink" />
    </div>
  );
}

export function MunshiWordmark({ className }: { className?: string }) {
  return (
    <div className={cn("leading-tight", className)}>
      <p className="text-[17px] font-bold tracking-tight text-fg">
        Munshi <span className="text-brand-strong">AI</span>
      </p>
      <p className="text-[11px] font-medium text-faint">Your AI Business Munshi</p>
    </div>
  );
}

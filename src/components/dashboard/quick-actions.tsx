import Link from "next/link";
import { MessageSquareText, Plus, ReceiptText, UserPlus } from "lucide-react";
import { cn } from "@/lib/cn";

const ACTIONS = [
  {
    href: "/sales",
    label: "Record Sale",
    icon: Plus,
    style: "bg-gradient-to-br from-brand to-brand-deep text-white shadow-glow",
  },
  {
    href: "/expenses",
    label: "Add Expense",
    icon: ReceiptText,
    style: "bg-panel3 text-fg hover:bg-panel2",
  },
  {
    href: "/customers",
    label: "Add Customer",
    icon: UserPlus,
    style: "bg-panel3 text-fg hover:bg-panel2",
  },
  {
    href: "/ask-munshi",
    label: "Ask Munshi",
    icon: MessageSquareText,
    style: "bg-gold/15 text-gold hover:bg-gold/25",
  },
];

export function QuickActions() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {ACTIONS.map((a) => {
        const Icon = a.icon;
        return (
          <Link
            key={a.href + a.label}
            href={a.href}
            className={cn(
              "flex h-9 items-center gap-1.5 rounded-xl px-3.5 text-xs font-bold transition-transform hover:-translate-y-0.5",
              a.style,
            )}
          >
            <Icon className="h-4 w-4" />
            {a.label}
          </Link>
        );
      })}
    </div>
  );
}

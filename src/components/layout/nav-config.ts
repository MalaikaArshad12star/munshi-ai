import {
  FileText,
  LayoutDashboard,
  Mic,
  Package,
  Settings,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  tKey: string;
  icon: LucideIcon;
  badge?: string;
  soon?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", tKey: "nav.dashboard", icon: LayoutDashboard },
  { href: "/sales", label: "Sales", tKey: "nav.sales", icon: TrendingUp },
  { href: "/expenses", label: "Expenses", tKey: "nav.expenses", icon: Wallet },
  { href: "/customers", label: "Customers", tKey: "nav.customers", icon: Users },
  { href: "/inventory", label: "Inventory", tKey: "nav.inventory", icon: Package },
  { href: "/documents", label: "Documents", tKey: "nav.documents", icon: FileText },
  { href: "/ask-munshi", label: "Ask Munshi", tKey: "nav.askMunshi", icon: Sparkles, badge: "AI" },
  { href: "/voice", label: "Voice Munshi", tKey: "nav.voice", icon: Mic },
  { href: "/settings", label: "Settings", tKey: "nav.settings", icon: Settings },
];

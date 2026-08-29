import type { Metadata } from "next";
import "@fontsource-variable/inter";
import "@fontsource/noto-nastaliq-urdu/400.css";
import "@fontsource/noto-nastaliq-urdu/600.css";
import "./globals.css";
import { AppShell } from "@/components/layout/app-shell";

export const metadata: Metadata = {
  title: "Munshi AI — Your AI Business Munshi",
  description:
    "Premium AI-powered business assistant for small businesses and shopkeepers. Sales, expenses, udhaar and insights — sab kuch ek jagah.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-ink text-fg">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}

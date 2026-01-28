import { ReactNode } from "react";
import { Header } from "./Header";
import { MobileNav } from "./MobileNav";
import { FloatingGiftWidget } from "@/components/gifting/FloatingGiftWidget";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background starfield grid-overlay">
      <Header />
      <main className="pt-20 pb-20 md:pb-8">
        {children}
      </main>
      <MobileNav />
      <FloatingGiftWidget />
    </div>
  );
}

import { ReactNode } from "react";
import { SupportSidebar } from "./SupportSidebar";
import { SupportHeader } from "./SupportHeader";

interface SupportLayoutProps {
    children: ReactNode;
}

export function SupportLayout({ children }: SupportLayoutProps) {
    return (
        <div className="flex h-screen bg-[#09090b] text-foreground overflow-hidden">
            <SupportSidebar />
            <div className="flex-1 flex flex-col min-w-0">
                <SupportHeader />
                <main className="flex-1 overflow-y-auto p-4 lg:p-8 cosmic-bg grid-overlay relative">
                    <div className="relative z-10">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}

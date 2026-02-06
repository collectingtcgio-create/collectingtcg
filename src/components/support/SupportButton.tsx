import { useState, useEffect } from "react";
import { LifeBuoy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SupportModal } from "./SupportModal";
import { cn } from "@/lib/utils";

export function SupportButton() {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const handleOpen = () => setIsOpen(true);
        window.addEventListener('open-support-modal', handleOpen);
        return () => window.removeEventListener('open-support-modal', handleOpen);
    }, []);

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className={cn(
                    "fixed bottom-20 md:bottom-24 right-4 z-40", // Positioned above ChatPopup
                    "w-12 h-12 rounded-full",
                    "bg-secondary/80 backdrop-blur-md text-secondary-foreground",
                    "border border-primary/20 shadow-lg",
                    "hover:bg-secondary hover:scale-110 hover:neon-glow-pink transition-all duration-300",
                    "flex items-center justify-center group text-primary/80"
                )}
                title="Get Support"
            >
                <LifeBuoy className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            </button>

            <SupportModal isOpen={isOpen} onOpenChange={setIsOpen} />
        </>
    );
}

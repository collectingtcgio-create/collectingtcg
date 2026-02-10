import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { SupportModal } from "./SupportModal";

export function SupportButton() {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const handleOpen = () => setIsOpen(true);
        window.addEventListener('open-support-modal', handleOpen);
        return () => window.removeEventListener('open-support-modal', handleOpen);
    }, []);

    return (
        <SupportModal isOpen={isOpen} onOpenChange={setIsOpen} />
    );
}

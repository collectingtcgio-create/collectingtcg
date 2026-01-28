import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { CreditCard } from "lucide-react";

interface CardPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string | null;
  cardName: string;
}

export function CardPreviewModal({ 
  open, 
  onOpenChange, 
  imageUrl, 
  cardName 
}: CardPreviewModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl p-2 bg-background/95 backdrop-blur-xl border-primary/30">
        <div className="aspect-[2.5/3.5] bg-muted rounded-lg overflow-hidden flex items-center justify-center">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={cardName}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <CreditCard className="w-16 h-16" />
              <p className="text-sm">{cardName}</p>
            </div>
          )}
        </div>
        <p className="text-center font-medium mt-2">{cardName}</p>
      </DialogContent>
    </Dialog>
  );
}

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, Search, AlertTriangle } from "lucide-react";

interface NoCardDetectedModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTryAgain: () => void;
  onSearchManually: () => void;
}

export function NoCardDetectedModal({
  open,
  onOpenChange,
  onTryAgain,
  onSearchManually,
}: NoCardDetectedModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-border/50 max-w-sm mx-auto">
        <DialogHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <DialogTitle className="text-xl">No Card Detected</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            We couldn't identify a card in the image. This might be due to poor lighting, blur, or the card not being fully visible.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pt-4">
          <Button
            onClick={() => {
              onOpenChange(false);
              onTryAgain();
            }}
            className="w-full rounded-full bg-primary hover:bg-primary/80 hover:neon-glow-cyan transition-all duration-300"
          >
            <Camera className="w-4 h-4 mr-2" />
            Try Again
          </Button>
          
          <Button
            onClick={() => {
              onOpenChange(false);
              onSearchManually();
            }}
            variant="outline"
            className="w-full rounded-full"
          >
            <Search className="w-4 h-4 mr-2" />
            Search Manually
          </Button>
        </div>

        <div className="mt-4 p-3 rounded-lg bg-muted/50">
          <p className="text-xs text-muted-foreground text-center">
            <strong className="text-foreground">Tips for better scans:</strong>
            <br />
            • Ensure good lighting
            <br />
            • Hold the camera steady
            <br />
            • Center the card in the viewfinder
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

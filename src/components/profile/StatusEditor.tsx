import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Pencil, Check, X } from "lucide-react";

interface StatusEditorProps {
  currentStatus: string;
  onUpdate: () => void;
}

export function StatusEditor({ currentStatus, onUpdate }: StatusEditorProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [status, setStatus] = useState(currentStatus);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!profile) return;

    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ status })
      .eq("id", profile.id);

    if (error) {
      toast({
        title: "Failed to update status",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Status updated!",
      });
      setIsEditing(false);
      onUpdate();
    }
    setSaving(false);
  };

  const handleCancel = () => {
    setStatus(currentStatus);
    setIsEditing(false);
  };

  if (!isEditing) {
    return (
      <div 
        className="group flex items-center gap-2 cursor-pointer hover:bg-muted/30 p-2 rounded-lg transition-colors -mx-2"
        onClick={() => setIsEditing(true)}
      >
        <span className="text-sm text-muted-foreground italic">
          {currentStatus ? `"${currentStatus}"` : "Set your status..."}
        </span>
        <Pencil className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        placeholder="What's on your mind?"
        className="bg-input border-border h-8 text-sm"
        maxLength={100}
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSave();
          if (e.key === "Escape") handleCancel();
        }}
      />
      <Button
        variant="ghost"
        size="icon"
        onClick={handleCancel}
        disabled={saving}
        className="h-8 w-8"
      >
        <X className="w-4 h-4" />
      </Button>
      <Button
        size="icon"
        onClick={handleSave}
        disabled={saving}
        className="h-8 w-8 bg-primary hover:bg-primary/80"
      >
        {saving ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Check className="w-4 h-4" />
        )}
      </Button>
    </div>
  );
}

interface StatusDisplayProps {
  status: string;
}

export function StatusDisplay({ status }: StatusDisplayProps) {
  if (!status) return null;
  
  return (
    <div className="text-sm text-muted-foreground italic">
      "{status}"
    </div>
  );
}

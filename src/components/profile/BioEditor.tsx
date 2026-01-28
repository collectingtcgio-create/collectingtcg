import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Pencil, Check, X } from "lucide-react";

interface BioEditorProps {
  currentBio: string;
  onUpdate: () => void;
}

export function BioEditor({ currentBio, onUpdate }: BioEditorProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [bio, setBio] = useState(currentBio);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!profile) return;

    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ bio })
      .eq("id", profile.id);

    if (error) {
      toast({
        title: "Failed to update bio",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Bio updated!",
        description: "Your about me section has been saved.",
      });
      setIsEditing(false);
      onUpdate();
    }
    setSaving(false);
  };

  const handleCancel = () => {
    setBio(currentBio);
    setIsEditing(false);
  };

  if (!isEditing) {
    return (
      <div className="group relative">
        <p className="text-sm text-foreground/80 whitespace-pre-wrap">
          {currentBio || "No bio yet. Click to add one!"}
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsEditing(true)}
          className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity h-7 px-2"
        >
          <Pencil className="w-3 h-3 mr-1" />
          Edit
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Textarea
        value={bio}
        onChange={(e) => setBio(e.target.value)}
        placeholder="Tell the world about yourself..."
        className="bg-input border-border resize-none"
        rows={4}
        maxLength={500}
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{bio.length}/500</span>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            disabled={saving}
          >
            <X className="w-4 h-4 mr-1" />
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="bg-primary hover:bg-primary/80"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin mr-1" />
            ) : (
              <Check className="w-4 h-4 mr-1" />
            )}
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}

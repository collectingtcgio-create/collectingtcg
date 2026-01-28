import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Edit2, Check, X, Calendar } from "lucide-react";
import { differenceInDays, format } from "date-fns";

interface UsernameEditorProps {
  currentUsername: string;
  lastUsernameChangeAt: string | null;
  onUpdate: () => void;
}

export function UsernameEditor({ 
  currentUsername, 
  lastUsernameChangeAt,
  onUpdate 
}: UsernameEditorProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState(currentUsername);
  const [saving, setSaving] = useState(false);

  // Calculate if user can change username (once per month = 30 days)
  const daysSinceLastChange = lastUsernameChangeAt 
    ? differenceInDays(new Date(), new Date(lastUsernameChangeAt))
    : null;
  
  const canChangeUsername = daysSinceLastChange === null || daysSinceLastChange >= 30;
  const daysUntilNextChange = daysSinceLastChange !== null 
    ? Math.max(0, 30 - daysSinceLastChange)
    : 0;

  const handleSave = async () => {
    if (!profile || !username.trim()) return;
    
    const trimmedUsername = username.trim();
    
    // Validate username
    if (trimmedUsername.length < 3) {
      toast({
        title: "Username too short",
        description: "Username must be at least 3 characters",
        variant: "destructive",
      });
      return;
    }
    
    if (trimmedUsername.length > 30) {
      toast({
        title: "Username too long",
        description: "Username must be 30 characters or less",
        variant: "destructive",
      });
      return;
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(trimmedUsername)) {
      toast({
        title: "Invalid username",
        description: "Username can only contain letters, numbers, and underscores",
        variant: "destructive",
      });
      return;
    }

    if (trimmedUsername === currentUsername) {
      setIsEditing(false);
      return;
    }

    setSaving(true);

    try {
      // Check if username is already taken
      const { data: existingUser } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", trimmedUsername)
        .neq("id", profile.id)
        .maybeSingle();

      if (existingUser) {
        toast({
          title: "Username taken",
          description: "This username is already in use",
          variant: "destructive",
        });
        setSaving(false);
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update({ 
          username: trimmedUsername,
          last_username_change_at: new Date().toISOString()
        })
        .eq("id", profile.id);

      if (error) throw error;

      toast({
        title: "Username updated!",
        description: "Your username has been changed successfully.",
      });
      
      setIsEditing(false);
      onUpdate();
    } catch (error: any) {
      toast({
        title: "Failed to update username",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setUsername(currentUsername);
    setIsEditing(false);
  };

  if (!isEditing) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-base font-medium">Username</Label>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(true)}
            disabled={!canChangeUsername}
            className="h-8 px-2"
          >
            <Edit2 className="w-4 h-4 mr-1" />
            Edit
          </Button>
        </div>
        <p className="text-foreground font-medium">{currentUsername}</p>
        {!canChangeUsername && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            <span>
              You can change your username again in {daysUntilNextChange} day{daysUntilNextChange !== 1 ? 's' : ''}
            </span>
          </div>
        )}
        {lastUsernameChangeAt && (
          <p className="text-xs text-muted-foreground">
            Last changed: {format(new Date(lastUsernameChangeAt), "MMM d, yyyy")}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Label className="text-base font-medium">Username</Label>
      <div className="flex gap-2">
        <Input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter new username"
          className="flex-1"
          maxLength={30}
        />
        <Button
          size="icon"
          onClick={handleSave}
          disabled={saving || !username.trim()}
          className="shrink-0"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Check className="w-4 h-4" />
          )}
        </Button>
        <Button
          size="icon"
          variant="outline"
          onClick={handleCancel}
          disabled={saving}
          className="shrink-0"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        3-30 characters, letters, numbers, and underscores only
      </p>
    </div>
  );
}

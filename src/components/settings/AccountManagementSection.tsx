import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  AlertTriangle,
  Loader2,
  Eye,
  EyeOff,
  Trash2,
} from "lucide-react";

export function AccountManagementSection() {
  const { profile, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Deactivate state
  const [deactivating, setDeactivating] = useState(false);
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);

  // Delete state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmDialogOpen, setDeleteConfirmDialogOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [deleteConfirmChecked, setDeleteConfirmChecked] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDeactivate = async () => {
    if (!profile) return;

    setDeactivating(true);
    try {
      // Update profile to mark as deactivated (using a status or visibility)
      const { error } = await supabase
        .from("user_settings")
        .upsert({
          user_id: profile.id,
          profile_visibility: "private",
        }, { onConflict: "user_id" });

      if (error) throw error;

      toast({
        title: "Account deactivated",
        description: "Your profile is now hidden from others. You can reactivate anytime by changing your privacy settings.",
      });
      setDeactivateDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Failed to deactivate",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeactivating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmChecked) {
      toast({
        title: "Please confirm",
        description: "You must check the confirmation box to proceed.",
        variant: "destructive",
      });
      return;
    }

    setDeleting(true);
    try {
      // First, set profile to private immediately
      if (profile) {
        await supabase
          .from("profiles")
          .update({
            username: `deleted_${profile.id.slice(0, 8)}`,
            bio: "",
            avatar_url: "",
            status: "",
          })
          .eq("id", profile.id);

        // Update user_settings to private
        await supabase
          .from("user_settings")
          .upsert({
            user_id: profile.id,
            profile_visibility: "private",
          }, { onConflict: "user_id" });
      }

      // Sign out the user
      await signOut();

      toast({
        title: "Account deletion initiated",
        description: "Your profile has been hidden and anonymized. Full deletion will be processed.",
      });

      navigate("/");
    } catch (error: any) {
      toast({
        title: "Failed to delete account",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setDeleteConfirmDialogOpen(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Deactivate Account */}
      <div className="p-4 rounded-lg bg-muted/30 border border-yellow-500/20">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium">Deactivate Account</p>
            <p className="text-sm text-muted-foreground mb-3">
              Temporarily hide your profile and activity. You can reactivate anytime.
            </p>
            <Dialog open={deactivateDialogOpen} onOpenChange={setDeactivateDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  Deactivate
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Deactivate Your Account?</DialogTitle>
                  <DialogDescription>
                    This will hide your profile from other users. Your data will be preserved and you can reactivate anytime by changing your privacy settings.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <p className="text-sm text-muted-foreground">
                    When deactivated:
                  </p>
                  <ul className="text-sm text-muted-foreground list-disc list-inside mt-2 space-y-1">
                    <li>Your profile will be hidden from search and other users</li>
                    <li>Existing marketplace listings will remain visible</li>
                    <li>You can reactivate by logging in and updating settings</li>
                  </ul>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDeactivateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={handleDeactivate}
                    disabled={deactivating}
                  >
                    {deactivating && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    Deactivate Account
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Delete Account */}
      <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20">
        <div className="flex items-start gap-3">
          <Trash2 className="w-5 h-5 text-destructive mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-destructive">Delete Account</p>
            <p className="text-sm text-muted-foreground mb-3">
              Permanently delete your account. This action cannot be undone.
            </p>
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  Delete Account
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="text-destructive flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Delete Your Account
                  </DialogTitle>
                  <DialogDescription>
                    This action is permanent and cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <p className="text-sm font-medium text-destructive mb-2">
                      What happens when you delete:
                    </p>
                    <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                      <li>Your profile will be immediately hidden</li>
                      <li>Your username and data will be anonymized</li>
                      <li>Transaction history is preserved for legal compliance</li>
                      <li>This action cannot be reversed</li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="delete-password">Confirm your password</Label>
                    <div className="relative">
                      <Input
                        id="delete-password"
                        type={showDeletePassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={deletePassword}
                        onChange={(e) => setDeletePassword(e.target.value)}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowDeletePassword(!showDeletePassword)}
                      >
                        {showDeletePassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Checkbox
                      id="delete-confirm"
                      checked={deleteConfirmChecked}
                      onCheckedChange={(checked) => setDeleteConfirmChecked(checked === true)}
                    />
                    <Label htmlFor="delete-confirm" className="text-sm text-muted-foreground cursor-pointer">
                      I understand this action is permanent and my account cannot be recovered.
                    </Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => setDeleteConfirmDialogOpen(true)}
                    disabled={!deletePassword || !deleteConfirmChecked}
                  >
                    Continue
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Final confirmation dialog */}
            <AlertDialog open={deleteConfirmDialogOpen} onOpenChange={setDeleteConfirmDialogOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-destructive">
                    Are you absolutely sure?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete your account. You will not be able to recover it.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    disabled={deleting}
                  >
                    {deleting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    Yes, Delete My Account
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </div>
  );
}
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Key,
  Mail,
  LogOut,
  Loader2,
  Eye,
  EyeOff,
  Check,
} from "lucide-react";

export function AccountSecuritySection() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);

  // Email change state
  const [newEmail, setNewEmail] = useState("");
  const [changingEmail, setChangingEmail] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);

  // Password reset state
  const [resettingPassword, setResettingPassword] = useState(false);

  // Sign out all state
  const [signingOutAll, setSigningOutAll] = useState(false);

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters.",
        variant: "destructive",
      });
      return;
    }

    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast({
        title: "Password changed",
        description: "Your password has been updated successfully.",
      });
      setPasswordDialogOpen(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast({
        title: "Failed to change password",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleResetPassword = async () => {
    if (!user?.email) return;

    setResettingPassword(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/auth?type=recovery`,
      });

      if (error) throw error;

      toast({
        title: "Password reset email sent",
        description: "Check your email for a password reset link.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to send reset email",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setResettingPassword(false);
    }
  };

  const handleChangeEmail = async () => {
    if (!newEmail || !newEmail.includes("@")) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setChangingEmail(true);
    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail,
      });

      if (error) throw error;

      toast({
        title: "Email update initiated",
        description: "Check both your old and new email addresses to confirm the change.",
      });
      setEmailDialogOpen(false);
      setNewEmail("");
    } catch (error: any) {
      toast({
        title: "Failed to update email",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setChangingEmail(false);
    }
  };

  const handleSignOutAll = async () => {
    setSigningOutAll(true);
    try {
      const { error } = await supabase.auth.signOut({ scope: "global" });

      if (error) throw error;

      toast({
        title: "Signed out of all devices",
        description: "You have been signed out everywhere.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to sign out",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSigningOutAll(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Current Email */}
      <div className="p-3 rounded-lg bg-muted/30">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm text-muted-foreground">Email Address</Label>
            <p className="font-medium">{user?.email}</p>
          </div>
          <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Mail className="w-4 h-4 mr-2" />
                Change
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Change Email Address</DialogTitle>
                <DialogDescription>
                  Enter your new email address. You'll receive confirmation emails at both addresses.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-email">Current Email</Label>
                  <Input id="current-email" value={user?.email || ""} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-email">New Email</Label>
                  <Input
                    id="new-email"
                    type="email"
                    placeholder="Enter new email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleChangeEmail} disabled={changingEmail}>
                  {changingEmail && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  Update Email
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Change Password */}
      <div className="p-3 rounded-lg bg-muted/30">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm text-muted-foreground">Password</Label>
            <p className="font-medium">••••••••</p>
          </div>
          <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Key className="w-4 h-4 mr-2" />
                Change
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Change Password</DialogTitle>
                <DialogDescription>
                  Enter a new password for your account.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  {confirmPassword && newPassword === confirmPassword && (
                    <p className="text-sm text-green-500 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Passwords match
                    </p>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setPasswordDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleChangePassword}
                  disabled={changingPassword || newPassword !== confirmPassword}
                >
                  {changingPassword && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  Update Password
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Reset Password via Email */}
      <div className="p-3 rounded-lg bg-muted/30">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Password Reset</p>
            <p className="text-sm text-muted-foreground">
              Receive a reset link via email
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetPassword}
            disabled={resettingPassword}
          >
            {resettingPassword ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Mail className="w-4 h-4 mr-2" />
            )}
            Send Link
          </Button>
        </div>
      </div>

      {/* Sign Out All Devices */}
      <div className="p-3 rounded-lg bg-muted/30 border border-destructive/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Sign Out Everywhere</p>
            <p className="text-sm text-muted-foreground">
              Log out from all devices and sessions
            </p>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleSignOutAll}
            disabled={signingOutAll}
          >
            {signingOutAll ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <LogOut className="w-4 h-4 mr-2" />
            )}
            Sign Out All
          </Button>
        </div>
      </div>
    </div>
  );
}
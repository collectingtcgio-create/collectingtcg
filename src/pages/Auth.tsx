import { useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Sparkles, Eye, EyeOff, Check } from "lucide-react";

export default function Auth() {
  const { user, signIn, signUp, resetPassword, resendConfirmation } = useAuth();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || "/";
  const { toast } = useToast();
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  // Auth Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Recovery State
  const [isRecovery, setIsRecovery] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);

  useEffect(() => {
    // Check URL parameter
    const params = new URLSearchParams(window.location.search);
    if (params.get('type') === 'recovery') {
      setIsRecovery(true);
    }

    // Listen for Auth events (specifically PASSWORD_RECOVERY)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (user && !isRecovery) {
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const needsConfirmation = await signUp(email, password, username);
        if (needsConfirmation) {
          // Switch to login view and show message
          setIsSignUp(false);
          toast({
            title: "Email confirmation required",
            description: "Please check your email and click the confirmation link before signing in.",
          });
        }
      } else {
        await signIn(email, password);
      }
    } catch (error: any) {
      // Better error handling for email not confirmed
      if (error?.message?.includes('Email not confirmed')) {
        toast({
          title: "Email not confirmed",
          description: "Please check your email and click the confirmation link to activate your account.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      return;
    }
    setResetLoading(true);
    try {
      await resetPassword(email);
    } catch {
      // Error handled in useAuth
    } finally {
      setResetLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email address to resend the confirmation.",
        variant: "destructive",
      });
      return;
    }
    setResetLoading(true);
    try {
      await resendConfirmation(email);
    } catch {
      // Error handled in useAuth
    } finally {
      setResetLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast({
        title: "Password updated successfully",
        description: "You can now sign in with your new password.",
      });

      // Clear state and go to login
      setIsRecovery(false);
      setIsSignUp(false); // Ensure we are on login tab
      setNewPassword("");
      setConfirmPassword("");

      // Remove the recovery params from URL
      window.history.replaceState({}, document.title, window.location.pathname);

    } catch (error: any) {
      toast({
        title: "Failed to update password",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background starfield grid-overlay">
      <div className="w-full max-w-md">
        <div className="glass-card p-8 neon-border-cyan">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary mb-4 neon-glow-cyan">
              <Sparkles className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              CollectingTCG
            </h1>
            <p className="text-muted-foreground mt-2">
              {isRecovery
                ? "Set your new password"
                : (isSignUp ? "Join the community" : "Welcome back, collector")}
            </p>
          </div>

          {isRecovery ? (
            // PASSWORD RECOVERY FORM
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showNewPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    className="bg-input border-border focus:neon-border-cyan pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="bg-input border-border focus:neon-border-cyan"
                />
                {confirmPassword && newPassword === confirmPassword && (
                  <p className="text-sm text-green-500 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Passwords match
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-primary hover:bg-primary/80 text-primary-foreground hover:neon-glow-cyan transition-all duration-300"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Update Password"
                )}
              </Button>

              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => setIsRecovery(false)}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Back to Sign In
                </button>
              </div>
            </form>
          ) : (
            // STANDARD LOGIN/SIGNUP FORM
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                {isSignUp && (
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      type="text"
                      placeholder="Choose a username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required={isSignUp}
                      className="bg-input border-border focus:neon-border-cyan"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-input border-border focus:neon-border-cyan"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="bg-input border-border focus:neon-border-cyan pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {!isSignUp && (
                  <div className="text-right space-y-2">
                    <button
                      type="button"
                      onClick={handleResetPassword}
                      disabled={resetLoading || !email}
                      className="text-sm text-primary hover:text-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed block ml-auto"
                    >
                      {resetLoading ? (
                        <span className="flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Sending...
                        </span>
                      ) : (
                        "Forgot password?"
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleResendConfirmation}
                      disabled={resetLoading || !email}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed block ml-auto"
                    >
                      Resend confirmation email
                    </button>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-full bg-primary hover:bg-primary/80 text-primary-foreground hover:neon-glow-cyan transition-all duration-300"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isSignUp ? (
                    "Create Account"
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {isSignUp
                    ? "Already have an account? Sign in"
                    : "Don't have an account? Sign up"}
                </button>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}

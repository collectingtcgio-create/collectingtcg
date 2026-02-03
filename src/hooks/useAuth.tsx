import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Profile {
  id: string;
  user_id: string;
  username: string;
  bio: string;
  avatar_url: string;
  is_live: boolean;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  toggleLive: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(async () => {
            const { data } = await supabase
              .from("profiles")
              .select("*")
              .eq("user_id", session.user.id)
              .single();
            setProfile(data);
          }, 0);
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        supabase
          .from("profiles")
          .select("*")
          .eq("user_id", session.user.id)
          .single()
          .then(({ data }) => setProfile(data));
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, username: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { username },
      },
    });

    if (error) {
      toast({
        title: "Sign up failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }

    toast({
      title: "Welcome to CollectingTCG!",
      description: "Your account has been created.",
    });
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        title: "Sign in failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }

    toast({
      title: "Welcome back!",
      description: "You have signed in successfully.",
    });
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Sign out failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth`,
    });

    if (error) {
      toast({
        title: "Password reset failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }

    toast({
      title: "Check your email",
      description: "We've sent you a password reset link.",
    });
  };

  const toggleLive = async () => {
    if (!profile) return;

    const { error } = await supabase
      .from("profiles")
      .update({ is_live: !profile.is_live })
      .eq("id", profile.id);

    if (error) {
      toast({
        title: "Failed to update live status",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setProfile((prev) => prev ? { ...prev, is_live: !prev.is_live } : null);
    
    toast({
      title: profile.is_live ? "You're offline" : "You're live!",
      description: profile.is_live 
        ? "Your stream has ended." 
        : "Others can now see you're live.",
    });
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!profile) return;

    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", profile.id);

    if (error) {
      toast({
        title: "Failed to update profile",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }

    setProfile((prev) => prev ? { ...prev, ...updates } : null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signUp,
        signIn,
        signOut,
        resetPassword,
        toggleLive,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

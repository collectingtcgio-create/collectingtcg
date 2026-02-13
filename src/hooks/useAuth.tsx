import { createContext, useContext, useEffect, useState, ReactNode, useRef } from "react";
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
    email_contact?: string;
}

type UserRole = 'admin' | 'support' | 'moderator' | 'user';

interface AuthContextType {
    user: User | null;
    profile: Profile | null;
    role: UserRole | null;
    loading: boolean;
    signUp: (email: string, password: string, username: string) => Promise<boolean>;
    signIn: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    resendConfirmation: (email: string) => Promise<void>;
    toggleLive: () => Promise<void>;
    updateProfile: (updates: Partial<Profile>) => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [role, setRole] = useState<UserRole | null>(null);
    const [loading, setLoading] = useState(true);
    const mounted = useRef(true);
    const { toast } = useToast();

    // Helper to wrap Supabase calls in a timeout
    const withTimeout = async <T,>(promise: Promise<T>, timeoutMs: number, defaultValue: T): Promise<T> => {
        const timeout = new Promise<T>((resolve) =>
            setTimeout(() => {
                console.warn(`[Auth] Request timed out after ${timeoutMs}ms. Returning default.`);
                resolve(defaultValue);
            }, timeoutMs)
        );
        return Promise.race([promise, timeout]);
    };

    const fetchRole = async (userId: string) => {
        console.log("[Auth] Fetching role for:", userId);
        const promise = (async () => {
            const { data, error } = await supabase
                .from("user_roles")
                .select("role")
                .eq("user_id", userId)
                .maybeSingle();

            if (error) {
                console.error("[Auth] Error fetching role:", error);
                return 'user' as UserRole;
            }
            console.log("[Auth] Role fetched:", data?.role || 'user');
            return (data?.role as UserRole) || 'user';
        })();

        return withTimeout(promise, 15000, 'user' as UserRole);
    };

    const fetchProfile = async (userId: string) => {
        console.log("[Auth] Fetching profile for:", userId);
        const promise = (async () => {
            try {
                const { data, error } = await supabase
                    .from("profiles")
                    .select("*")
                    .eq("user_id", userId)
                    .maybeSingle();

                if (error) {
                    console.error("[Auth] Error fetching profile:", error);
                    return null;
                }

                if (!data) {
                    console.warn("[Auth] No profile found for user:", userId, ". Attempting to create one...");
                    // Try to create profile if it doesn't exist (trigger might have failed or race condition)
                    const { data: newProfile, error: insertError } = await supabase
                        .from("profiles")
                        .insert({
                            user_id: userId,
                            username: `user_${userId.substring(0, 8)}`
                        })
                        .select()
                        .maybeSingle();

                    if (insertError) {
                        console.error("[Auth] Failed to auto-create profile:", insertError);
                        return null;
                    }

                    console.log("[Auth] Profile auto-created successfully:", newProfile?.username);
                    return newProfile as Profile;
                }

                console.log("[Auth] Profile fetched successfully for:", data.username);
                return data as Profile;
            } catch (err) {
                console.error("[Auth] Exception during profile fetch:", err);
                return null;
            }
        })();

        return withTimeout(promise, 20000, null);
    };

    const refreshProfile = async () => {
        if (!user) return;
        setLoading(true);
        const p = await fetchProfile(user.id);
        if (mounted.current) {
            setProfile(p);
            setLoading(false);
        }
    };

    useEffect(() => {
        let authInitialized = false;
        console.log("[Auth] Provider mounting...");

        const loadUserData = async (session: any) => {
            if (!session?.user) {
                setProfile(null);
                setRole(null);
                return;
            }

            console.log("[Auth] Loading user data for:", session.user.id);
            const [p, r] = await Promise.all([
                fetchProfile(session.user.id),
                fetchRole(session.user.id)
            ]);

            if (mounted.current) {
                setProfile(p);
                setRole(r);
                console.log("[Auth] SESSION UID:", session.user.id);
                console.log("[Auth] FETCHED ROLE:", r);
                console.log("[Auth] FINAL PERMISSIONS - Profile:", !!p, "Role:", r);
            }
        };

        const initializeAuth = async () => {
            if (authInitialized) return;
            console.log("[Auth] Initializing session check...");

            try {
                const { data: { session } } = await withTimeout(
                    supabase.auth.getSession(),
                    20000,
                    { data: { session: null }, error: null } as any
                );

                if (!mounted.current) return;
                console.log("[Auth] Session result:", session ? "Active" : "None");

                if (session) {
                    setUser(session.user);
                    // authInitialized = true; // Move this until after loadUserData
                    await loadUserData(session);
                }
            } catch (err) {
                console.error("[Auth] critical failure in initializeAuth:", err);
            } finally {
                if (mounted.current) {
                    setLoading(false);
                    authInitialized = true;
                }
            }
        };

        // Start initialization
        initializeAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                console.log("[Auth] State Change:", event, !!session);
                if (!mounted) return;

                const prevUserId = user?.id;
                setUser(session?.user ?? null);

                if (session) {
                    const isNewLogin = event === 'SIGNED_IN';
                    const isDifferentUser = prevUserId && prevUserId !== session.user.id;

                    // If it's a new login or a different user, we MUST fetch data
                    if (isNewLogin || isDifferentUser) {
                        console.log("[Auth] Triggering data fetch for new login/user Change.");
                        setLoading(true);
                        await loadUserData(session);
                        if (mounted) setLoading(false);
                        authInitialized = true;
                    }
                    // Note: INITIAL_SESSION is deliberately handled by initializeAuth()
                    // to prevent duplicate fetches or race conditions during the very first load.
                } else if (event === 'SIGNED_OUT') {
                    setProfile(null);
                    setRole(null);
                    setLoading(false);
                    authInitialized = true;
                }
            }
        );

        return () => {
            mounted.current = false;
            subscription.unsubscribe();
        };
    }, []);

    const signUp = async (email: string, password: string, username: string) => {
        const { data, error } = await supabase.auth.signUp({
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

        // Check if email confirmation is required
        const needsConfirmation = data.user && !data.session;

        toast({
            title: needsConfirmation ? "Check your email!" : "Welcome to CollectingTCG!",
            description: needsConfirmation
                ? "We've sent you a confirmation link. Please check your email to activate your account."
                : "Your account has been created.",
        });

        return needsConfirmation;
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

    const resendConfirmation = async (email: string) => {
        const { error } = await supabase.auth.resend({
            type: 'signup',
            email: email,
            options: {
                emailRedirectTo: window.location.origin,
            }
        });

        if (error) {
            toast({
                title: "Failed to resend confirmation",
                description: error.message,
                variant: "destructive",
            });
            throw error;
        }

        toast({
            title: "Confirmation email sent",
            description: "Please check your email for the confirmation link.",
        });
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
                role,
                loading,
                signUp,
                signIn,
                signOut,
                resetPassword,
                resendConfirmation,
                toggleLive,
                updateProfile,
                refreshProfile,
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

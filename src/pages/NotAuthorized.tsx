import React from "react";
import { Layout } from "@/components/layout/Layout";
import { ShieldAlert, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export default function NotAuthorized() {
    const navigate = useNavigate();
    const { role } = useAuth();
    const hasAccess = role === 'admin' || role === 'support';

    // Auto-redirect if permissions are restored
    React.useEffect(() => {
        if (hasAccess) {
            const timer = setTimeout(() => {
                navigate("/support");
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [hasAccess, navigate]);

    return (
        <Layout>
            <div className="flex h-[80vh] flex-col items-center justify-center space-y-4 text-center">
                <div className="bg-destructive/10 p-6 rounded-full border border-destructive/20 animate-pulse">
                    <ShieldAlert className="h-16 w-16 text-destructive" />
                </div>
                <h1 className="text-4xl font-black tracking-tighter uppercase">Access Denied</h1>
                <p className="text-muted-foreground max-w-md text-lg">
                    {hasAccess
                        ? "Your permissions have been restored! You can now access the staff area."
                        : "This area is restricted to staff members. If you were recently granted access, please try logging out and back in."
                    }
                </p>
                <div className="flex gap-4 mt-6">
                    {hasAccess ? (
                        <Button onClick={() => navigate("/support")} className="h-12 px-8 bg-[#7c3aed] hover:bg-[#7c3aed]/90 group">
                            Go to Support Console
                            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    ) : (
                        <>
                            <Button onClick={() => navigate("/")} variant="outline" className="h-12 px-8">
                                Return Home
                            </Button>
                            <Button onClick={() => navigate("/auth")} className="h-12 px-8 bg-[#7c3aed] hover:bg-[#7c3aed]/90">
                                Login as Staff
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </Layout>
    );
}

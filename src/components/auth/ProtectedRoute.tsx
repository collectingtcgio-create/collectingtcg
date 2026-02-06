import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: ('admin' | 'support' | 'moderator' | 'user')[];
}

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
    const { user, role, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#09090b]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-[#7c3aed]" />
                    <p className="text-sm text-muted-foreground animate-pulse">Checking credentials...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/auth" state={{ from: location }} replace />;
    }

    // If we have a user but no role yet, and we are not in a 'loading' state,
    // we should still wait a moment if allowedRoles is specified, 
    // because role-fetching might be slightly behind session initialization in some race conditions.
    if (allowedRoles && role === null) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#09090b]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-[#7c3aed]" />
                    <p className="text-sm text-muted-foreground animate-pulse">Resolving permissions...</p>
                </div>
            </div>
        );
    }

    if (allowedRoles) {
        const hasRequiredRole = role && allowedRoles.includes(role as any);
        if (!hasRequiredRole) {
            return <Navigate to="/not-authorized" replace />;
        }
    }

    return <>{children}</>;
};

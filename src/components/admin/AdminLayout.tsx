import { useState, ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import {
    LayoutDashboard,
    Users,
    ShoppingBag,
    AlertTriangle,
    History,
    Settings,
    Menu,
    X,
    Shield,
    ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

interface AdminLayoutProps {
    children: ReactNode;
    title?: string;
}

export function AdminLayout({ children, title }: AdminLayoutProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const location = useLocation();
    const { profile } = useAuth();

    const menuItems = [
        { title: "Overview", icon: LayoutDashboard, href: "/admin" },
        { title: "Users", icon: Users, href: "/admin/users" },
        { title: "Listings", icon: ShoppingBag, href: "/admin/listings" },
        { title: "Escalations", icon: AlertTriangle, href: "/admin/escalations" },
        { title: "Audit Logs", icon: History, href: "/admin/audit-logs" },
        { title: "Settings", icon: Settings, href: "/admin/settings" },
    ];

    return (
        <div className="min-h-screen bg-[#09090b] text-slate-50 flex">
            {/* Sidebar - Desktop */}
            <aside className="hidden lg:flex w-64 border-r border-border/40 flex-col sticky top-0 h-screen bg-[#0c0c0e]">
                <div className="p-6 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/50">
                        <Shield className="w-5 h-5 text-primary" />
                    </div>
                    <span className="font-bold text-lg tracking-tight">Admin Portal</span>
                </div>

                <nav className="flex-1 px-4 space-y-1 py-4">
                    {menuItems.map((item) => (
                        <Link
                            key={item.href}
                            to={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200 group",
                                location.pathname === item.href
                                    ? "bg-primary/10 text-primary border border-primary/20"
                                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                            )}
                        >
                            <item.icon className={cn(
                                "w-4 h-4",
                                location.pathname === item.href ? "text-primary" : "group-hover:text-white"
                            )} />
                            <span className="font-medium text-sm">{item.title}</span>
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-border/40">
                    <Link to="/">
                        <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground">
                            <ArrowLeft className="w-4 h-4" />
                            Back to Site
                        </Button>
                    </Link>
                    <div className="mt-4 flex items-center gap-3 px-2">
                        <div className="w-8 h-8 rounded-full bg-slate-800 border border-border flex items-center justify-center overflow-hidden">
                            {profile?.avatar_url ? (
                                <img src={profile.avatar_url} alt="Admin" className="w-full h-full object-cover" />
                            ) : (
                                <Users className="w-4 h-4 text-slate-400" />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{profile?.username || 'Admin'}</p>
                            <p className="text-xs text-muted-foreground truncate uppercase tracking-widest font-semibold">Administrator</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Mobile Drawer */}
            <div className={cn(
                "fixed inset-0 bg-black/80 z-50 lg:hidden transition-opacity duration-300",
                isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
            )} onClick={() => setIsSidebarOpen(false)} />

            <aside className={cn(
                "fixed top-0 bottom-0 left-0 w-72 bg-[#0c0c0e] z-50 lg:hidden transition-transform duration-300 transform border-r border-border/40",
                isSidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="p-6 flex items-center justify-between border-b border-border/40">
                    <div className="flex items-center gap-3">
                        <Shield className="w-6 h-6 text-primary" />
                        <span className="font-bold">Admin Portal</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)}>
                        <X className="w-5 h-5" />
                    </Button>
                </div>
                <nav className="p-4 space-y-2">
                    {menuItems.map((item) => (
                        <Link
                            key={item.href}
                            to={item.href}
                            onClick={() => setIsSidebarOpen(false)}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-lg",
                                location.pathname === item.href
                                    ? "bg-primary/20 text-primary"
                                    : "text-muted-foreground"
                            )}
                        >
                            <item.icon className="w-5 h-5" />
                            <span className="font-medium">{item.title}</span>
                        </Link>
                    ))}
                </nav>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                <header className="h-16 border-b border-border/40 bg-[#09090b]/80 backdrop-blur-md sticky top-0 z-40 flex items-center px-4 lg:px-8 justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="lg:hidden"
                            onClick={() => setIsSidebarOpen(true)}
                        >
                            <Menu className="w-6 h-6" />
                        </Button>
                        {title && <h1 className="text-lg font-semibold tracking-tight">{title}</h1>}
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Quick stats or notifications could go here */}
                    </div>
                </header>

                <main className="flex-1 p-4 lg:p-8 animate-in fade-in duration-500">
                    {children}
                </main>
            </div>
        </div>
    );
}

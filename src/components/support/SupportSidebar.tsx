import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Inbox,
    Gavel,
    Flag,
    Users,
    MessageSquareQuote,
    HelpCircle,
    LogOut,
    ExternalLink
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/support" },
    { icon: Inbox, label: "Inbox", href: "/support/inbox" },
    { icon: Gavel, label: "Disputes", href: "/support/disputes" },
    { icon: Flag, label: "Reports", href: "/support/reports" },
    { icon: Users, label: "Users", href: "/support/users" },
    { icon: MessageSquareQuote, label: "Saved Replies", href: "/support/replies" },
];

export function SupportSidebar() {
    const location = useLocation();
    const { signOut, role } = useAuth();

    return (
        <aside className="w-64 flex flex-col h-screen bg-[#09090b] border-r border-border/50 sticky top-0 shrink-0">
            <div className="p-6">
                <Link to="/" className="flex items-center gap-3 mb-10 group">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#d946ef] flex items-center justify-center font-black text-white group-hover:neon-glow-purple transition-all shadow-[0_0_20px_rgba(124,58,237,0.3)]">
                        C
                    </div>
                    <div>
                        <span className="font-black text-lg tracking-tighter uppercase block leading-none">Collecting</span>
                        <span className="text-[10px] text-[#7c3aed] font-bold tracking-[0.2em] uppercase">Support</span>
                    </div>
                </Link>

                <nav className="space-y-1.5">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                to={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all group",
                                    isActive
                                        ? "bg-[#7c3aed]/10 text-white border border-[#7c3aed]/30 shadow-[0_0_15px_rgba(124,58,237,0.1)]"
                                        : "text-muted-foreground hover:text-white hover:bg-white/5 active:scale-95"
                                )}
                            >
                                <item.icon className={cn(
                                    "h-4 w-4 transition-colors",
                                    isActive ? "text-[#7c3aed]" : "group-hover:text-white"
                                )} />
                                {item.label}
                                {isActive && (
                                    <div className="ml-auto w-1 h-4 bg-[#7c3aed] rounded-full shadow-[0_0_10px_#7c3aed]" />
                                )}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            <div className="mt-auto p-4 space-y-2">
                {role === 'admin' && (
                    <Link
                        to="/admin"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all border border-transparent hover:border-rose-500/20"
                    >
                        <ExternalLink className="h-4 w-4" />
                        Admin Dashboard
                    </Link>
                )}
                <Link
                    to="/"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-muted-foreground hover:text-white hover:bg-white/5 transition-all"
                >
                    <ExternalLink className="h-4 w-4" />
                    Exit to Main Site
                </Link>
                <Link
                    to="/support/help"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-muted-foreground hover:text-white hover:bg-white/5 transition-all"
                >
                    <HelpCircle className="h-4 w-4" />
                    Help & Docs
                </Link>
                <div className="pt-4 border-t border-border/50">
                    <button
                        onClick={() => signOut()}
                        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-semibold text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all active:scale-95"
                    >
                        <LogOut className="h-4 w-4" />
                        Logout Session
                    </button>
                </div>
            </div>
        </aside>
    );
}

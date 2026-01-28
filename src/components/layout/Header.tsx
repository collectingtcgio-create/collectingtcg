import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, Search, Camera, BookOpen, User, Radio, LogOut, ShoppingBag, Mail } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useMessages } from "@/hooks/useMessages";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const navItems = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/search", icon: Search, label: "Find Players" },
  { path: "/scanner", icon: Camera, label: "Scanner" },
  { path: "/marketplace", icon: ShoppingBag, label: "Marketplace" },
  { path: "/messages", icon: Mail, label: "Messages" },
  { path: "/collections", icon: BookOpen, label: "Collections" },
  { path: "/profile", icon: User, label: "Profile" },
];

export function Header() {
  const location = useLocation();
  const { user, profile, signOut, toggleLive } = useAuth();
  const { unreadCount } = useMessages();
  const [isLiveLoading, setIsLiveLoading] = useState(false);

  const handleGoLive = async () => {
    setIsLiveLoading(true);
    await toggleLive();
    setIsLiveLoading(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-border/30">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center neon-glow-cyan">
              <span className="text-primary-foreground font-bold text-lg">C</span>
            </div>
            <span className="hidden sm:block text-lg font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              CollectingTCG
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              const showBadge = item.path === "/messages" && unreadCount > 0;
              return (
                <Link key={item.path} to={item.path}>
                  <Button
                    variant="ghost"
                    className={cn(
                      "gap-2 transition-all duration-300 relative",
                      isActive && "bg-muted neon-border-cyan text-primary"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden lg:inline">{item.label}</span>
                    {showBadge && (
                      <Badge className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 bg-secondary text-secondary-foreground text-xs">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </Badge>
                    )}
                  </Button>
                </Link>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {user && (
              <>
                <Button
                  onClick={handleGoLive}
                  disabled={isLiveLoading}
                  className={cn(
                    "rounded-full px-6 font-semibold transition-all duration-300",
                    profile?.is_live
                      ? "bg-secondary hover:bg-secondary/80 neon-glow-magenta pulse-live"
                      : "bg-muted hover:bg-muted/80 text-foreground hover:neon-glow-magenta"
                  )}
                >
                  <Radio className={cn("w-4 h-4 mr-2", profile?.is_live && "animate-pulse")} />
                  {profile?.is_live ? "LIVE" : "GO LIVE"}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={signOut}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </>
            )}
            {!user && (
              <Link to="/auth">
                <Button className="rounded-full px-6 bg-primary hover:bg-primary/80 text-primary-foreground hover:neon-glow-cyan transition-all duration-300">
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

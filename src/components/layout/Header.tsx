import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, Search, BookOpen, User, LogOut, ShoppingBag, Mail, Settings, LifeBuoy } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useMessages } from "@/hooks/useMessages";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { NotificationsDropdown } from "./NotificationsDropdown";
import collectingTcgLogo from "@/assets/collectingtcg-logo.png";

const navItems = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/search", icon: Search, label: "Find Players" },
  { path: "/marketplace", icon: ShoppingBag, label: "Marketplace" },
  { path: "/messages", icon: Mail, label: "Messages" },
  { path: "/collections", icon: BookOpen, label: "Collections" },
  { path: "/profile", icon: User, label: "Profile" },
  { path: "/support-contact", icon: LifeBuoy, label: "Support", isAction: true },
];

export function Header() {
  const location = useLocation();
  const { user, profile, signOut } = useAuth();
  const { unreadCount } = useMessages();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/30">
      <div className="max-w-[1600px] mx-auto px-6">
        <div className="flex items-center justify-between h-20 md:h-24 gap-4">
          {/* Left: Logo */}
          <div className="flex-1 flex justify-start min-w-0">
            <Link to="/" className="flex items-center gap-3">
              <img
                src={collectingTcgLogo}
                alt="CollectingTCG Logo"
                className="h-14 w-14 object-contain filter drop-shadow-[0_0_8px_rgba(236,72,153,0.5)]"
              />
              <div className="flex items-center gap-2 whitespace-nowrap">
                <span className="text-lg lg:text-xl font-bold gradient-text tracking-tight shrink-0">
                  CollectingTCG
                </span>
                <span className="text-muted-foreground text-lg hidden xl:inline-block">•</span>
                <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-400 hidden xl:inline-block">
                  Non Sports Cards
                </span>
              </div>
            </Link>
          </div>

          {/* Center: Navigation */}
          <nav className="hidden md:flex items-center gap-0.5 shrink-0">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              const showBadge = item.path === "/messages" && unreadCount > 0;

              if (item.isAction) {
                return (
                  <Button
                    key={item.label}
                    variant="ghost"
                    size="sm"
                    onClick={() => window.dispatchEvent(new CustomEvent('open-support-modal'))}
                    className="gap-2 transition-all duration-300 relative rounded-xl px-3 hover:text-primary"
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden lg:inline text-sm">{item.label}</span>
                  </Button>
                );
              }

              return (
                <Link key={item.path} to={item.path}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "gap-2 transition-all duration-300 relative rounded-xl px-3",
                      isActive && "nav-active bg-muted/50 text-primary"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden lg:inline text-sm">{item.label}</span>
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

          {/* Right: Actions */}
          <div className="flex-1 flex items-center justify-end gap-3 min-w-0">
            {/* Coming Soon Badge */}
            <span className="badge-coming-soon hidden lg:inline-flex shrink-0">
              Coming Soon
            </span>

            {/* Notifications Bell */}
            {user && <NotificationsDropdown />}

            {user && (
              <Link to="/settings" className="shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-foreground rounded-xl"
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </Link>
            )}
            {user && (
              <Button
                variant="ghost"
                size="icon"
                onClick={signOut}
                className="text-muted-foreground hover:text-foreground rounded-xl shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            )}
            {!user && (
              <Link to="/auth" className="shrink-0">
                <Button className="rounded-full px-5 bg-primary hover:bg-primary/90 text-primary-foreground hover:neon-glow-cyan transition-all duration-300 text-sm">
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

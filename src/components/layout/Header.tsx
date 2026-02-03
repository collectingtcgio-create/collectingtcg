import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, Search, BookOpen, User, LogOut, ShoppingBag, Mail } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useMessages } from "@/hooks/useMessages";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { NotificationsDropdown } from "./NotificationsDropdown";

const navItems = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/search", icon: Search, label: "Find Players" },
  { path: "/marketplace", icon: ShoppingBag, label: "Marketplace" },
  { path: "/messages", icon: Mail, label: "Messages" },
  { path: "/collections", icon: BookOpen, label: "Collections" },
  { path: "/profile", icon: User, label: "Profile" },
];

export function Header() {
  const location = useLocation();
  const { user, profile, signOut } = useAuth();
  const { unreadCount } = useMessages();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/30">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center neon-glow-pink">
              <span className="text-primary-foreground font-bold text-base">C</span>
            </div>
            <span className="hidden sm:block text-lg font-bold gradient-text">
              CollectingTCG
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              const showBadge = item.path === "/messages" && unreadCount > 0;
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

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Coming Soon Badge */}
            <span className="badge-coming-soon hidden sm:inline-flex">
              Coming Soon
            </span>

            {/* Notifications Bell */}
            {user && <NotificationsDropdown />}

            {user && (
              <Button
                variant="ghost"
                size="icon"
                onClick={signOut}
                className="text-muted-foreground hover:text-foreground rounded-xl"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            )}
            {!user && (
              <Link to="/auth">
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

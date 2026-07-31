import { cn } from "@/lib/utils";
import { useAuth } from "@/stores/auth";
import { Link, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Swords,
  Package,
  Users,
  Settings,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/pokemon", icon: Swords, label: "Pokémon" },
  { to: "/boxes", icon: Package, label: "Boxes" },
  { to: "/ots", icon: Users, label: "OTs" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export function Sidebar() {
  const location = useLocation();
  const { user, logout } = useAuth();

  return (
    <aside className="flex h-full w-56 flex-col border-r bg-card">
      {/* Brand */}
      <div className="flex h-14 items-center gap-2 px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Swords className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="font-semibold">Enredex</span>
      </div>
      <Separator />

      {/* Nav */}
      <nav className="flex-1 space-y-1 p-2">
        {navItems.map((item) => {
          const isActive =
            item.to === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(item.to);
          return (
            <Link key={item.to} to={item.to} className="block">
              <Button
                variant={isActive ? "secondary" : "ghost"}
                size="sm"
                className={cn(
                  "w-full justify-start gap-2",
                  isActive && "font-medium",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Button>
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <Separator />
      <div className="p-2">
        <div className="flex items-center gap-3 rounded-md px-2 py-1.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-medium">
            {user?.name?.charAt(0).toUpperCase() ?? "?"}
          </div>
          <div className="flex-1 truncate">
            <p className="truncate text-sm font-medium">{user?.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {user?.homePlan === "premium" ? "Premium" : "Free"} plan
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={logout}
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}

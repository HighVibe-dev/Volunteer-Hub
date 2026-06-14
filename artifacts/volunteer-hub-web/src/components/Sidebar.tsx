import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Users, Calendar, ClipboardList, CheckSquare,
  Award, Trophy, BarChart3, Wrench, UserPlus, LogOut, User, ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const ADMIN_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/volunteers", label: "Volunteers", icon: Users },
  { href: "/events", label: "Events", icon: Calendar },
  { href: "/applications", label: "Applications", icon: ClipboardList },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/skills", label: "Skills", icon: Wrench },
  { href: "/staff/new", label: "Add Staff", icon: UserPlus },
  { href: "/audit-log", label: "Audit Log", icon: ShieldAlert },
];

const COORDINATOR_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/volunteers", label: "Volunteers", icon: Users },
  { href: "/events", label: "Events", icon: Calendar },
  { href: "/applications", label: "Applications", icon: ClipboardList },
  { href: "/attendance", label: "Attendance", icon: CheckSquare },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
];

const VOLUNTEER_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/events", label: "Events", icon: Calendar },
  { href: "/applications", label: "My Applications", icon: ClipboardList },
  { href: "/attendance", label: "My Attendance", icon: CheckSquare },
  { href: "/certificates", label: "Certificates", icon: Award },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/profile", label: "My Profile", icon: User },
];

export function Sidebar() {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  if (!user) return null;

  let links = VOLUNTEER_LINKS;
  if (user.role === "ADMIN") links = ADMIN_LINKS;
  if (user.role === "COORDINATOR") links = COORDINATOR_LINKS;

  const isActive = (href: string) =>
    location === href || location.startsWith(`${href}/`);

  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border hidden md:flex flex-col h-screen sticky top-0">
      <div className="p-6">
        <img
          src="/nayepankh-logo.png"
          alt="NayePankh"
          style={{ height: "2rem", width: "auto", objectFit: "contain" }}
        />
        <div className="mt-1 text-xs text-muted-foreground capitalize">{user.role.toLowerCase()} portal</div>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon;
          const active = isActive(link.href);
          return (
            <Link key={link.href} href={link.href}>
              <a
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
                data-testid={`nav-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <Icon className="w-4 h-4" />
                {link.label}
              </a>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <Link href="/profile">
          <div className="flex items-center gap-3 px-3 py-2 mb-2 rounded-md hover:bg-sidebar-accent cursor-pointer transition-colors">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
              {user.firstName[0]}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-medium truncate">{user.firstName} {user.lastName}</span>
              <span className="text-xs text-muted-foreground truncate capitalize">{user.role.toLowerCase()}</span>
            </div>
          </div>
        </Link>
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-foreground"
          onClick={logout}
          data-testid="nav-logout"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Log out
        </Button>
      </div>
    </aside>
  );
}

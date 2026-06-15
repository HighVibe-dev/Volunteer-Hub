import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Users, Calendar, ClipboardList, CheckSquare,
  Award, Trophy, BarChart3, Wrench, UserPlus, LogOut, User, ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useGetMyProfile,
  getGetMyProfileQueryKey,
} from "@workspace/api-client-react";

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

function getLevelLabel(hours: number) {
  if (hours >= 100) return { emoji: "🏆", name: "Community Champion" };
  if (hours >= 50)  return { emoji: "🌳", name: "Impact Leader" };
  if (hours >= 10)  return { emoji: "🌿", name: "Community Helper" };
  return                    { emoji: "🌱", name: "Beginner Volunteer" };
}

export function Sidebar() {
  const { user, logout } = useAuth();
  const [location]       = useLocation();

  const isVolunteer = user?.role === "VOLUNTEER";

  const { data: profile } = useGetMyProfile({
    query: {
      enabled: isVolunteer,
      queryKey: getGetMyProfileQueryKey(),
      staleTime: 60_000,
    },
  });

  if (!user) return null;

  let links = VOLUNTEER_LINKS;
  if (user.role === "ADMIN") links = ADMIN_LINKS;
  if (user.role === "COORDINATOR") links = COORDINATOR_LINKS;

  const isActive = (href: string) =>
    location === href || location.startsWith(`${href}/`);

  const level = getLevelLabel(profile?.totalHours ?? 0);

  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border hidden md:flex flex-col h-screen sticky top-0">
      <div className="px-6 pt-5 pb-4">
        <img
          src="/nayepankh-logo.png"
          alt="NayePankh"
          style={{ height: "4rem", width: "auto", objectFit: "contain" }}
        />
        <div className="mt-1 text-xs text-muted-foreground capitalize">{user.role.toLowerCase()} portal</div>
      </div>

      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {links.map((link) => {
          const Icon   = link.icon;
          const active = isActive(link.href);
          return (
            <Link key={link.href} href={link.href}>
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer relative",
                  active
                    ? "text-primary bg-primary/10"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
                data-testid={`nav-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r-full" />
                )}
                <div className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                  active ? "bg-primary/15" : "bg-transparent"
                )}>
                  <Icon className={cn("w-4 h-4", active ? "text-primary" : "")} />
                </div>
                {link.label}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        <Link href="/profile">
          <div className="flex items-center gap-3 px-3 py-2.5 mb-1 rounded-lg hover:bg-sidebar-accent cursor-pointer transition-colors">
            <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold text-sm shrink-0">
              {(user.firstName ?? "V")[0]}
            </div>
            <div className="flex flex-col overflow-hidden flex-1 min-w-0">
              <span className="text-sm font-medium truncate">
                {user.firstName ?? ""} {user.lastName ?? ""}
              </span>
              {isVolunteer ? (
                <span className="text-[10px] font-medium text-primary/80 truncate">
                  {level.emoji} {level.name}
                </span>
              ) : (
                <span className="text-xs text-muted-foreground truncate capitalize">
                  {user.role.toLowerCase()}
                </span>
              )}
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

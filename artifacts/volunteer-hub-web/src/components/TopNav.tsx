import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetUnreadNotificationCount,
  getGetUnreadNotificationCountQueryKey,
  useListNotifications,
  getListNotificationsQueryKey,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useGlobalSearch,
  getGlobalSearchQueryKey,
} from "@workspace/api-client-react";
import { Bell, Search, Sun, Moon, Menu, Check, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sidebar } from "./Sidebar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

function notificationIcon(type: string) {
  const base = "inline-block w-2 h-2 rounded-full mr-2 shrink-0";
  switch (type) {
    case "APPLICATION_UPDATE": return <span className={cn(base, "bg-blue-500")} />;
    case "EVENT_UPDATE": return <span className={cn(base, "bg-primary")} />;
    case "CERTIFICATE_ISSUED": return <span className={cn(base, "bg-green-500")} />;
    default: return <span className={cn(base, "bg-muted-foreground")} />;
  }
}

function NotificationsDropdown() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const qc = useQueryClient();

  const { data: unreadCount } = useGetUnreadNotificationCount({
    query: { refetchInterval: 30000, enabled: !!user, queryKey: getGetUnreadNotificationCountQueryKey() },
  });

  const { data: notifications, isLoading } = useListNotifications(
    { size: 10, unreadOnly: false },
    {
      query: {
        enabled: !!user,
        queryKey: getListNotificationsQueryKey({ size: 10, unreadOnly: false }),
        refetchInterval: 30000,
      },
    }
  );

  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const invalidateNotifications = () => {
    qc.invalidateQueries({ queryKey: getListNotificationsQueryKey({ size: 10, unreadOnly: false }) });
    qc.invalidateQueries({ queryKey: getGetUnreadNotificationCountQueryKey() });
  };

  const handleMarkRead = (notificationId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    markRead.mutate({ notificationId }, { onSuccess: invalidateNotifications });
  };

  const handleMarkAllRead = () => {
    markAllRead.mutate(undefined, { onSuccess: invalidateNotifications });
  };

  const navigateToRelated = (type: string, relatedId: number | null | undefined) => {
    if (!relatedId) return;
    if (type === "APPLICATION_UPDATE" || type === "EVENT_UPDATE") {
      setLocation(`/events/${relatedId}`);
    } else if (type === "CERTIFICATE_ISSUED") {
      setLocation("/certificates");
    }
  };

  const items = notifications?.content ?? [];
  const hasUnread = (unreadCount?.count ?? 0) > 0;

  return (
    <>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" data-testid="btn-notifications">
          <Bell className="h-5 w-5" />
          {hasUnread && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px]">
              {(unreadCount?.count ?? 0) > 99 ? "99+" : unreadCount?.count}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <span className="font-semibold text-sm">Notifications</span>
          {hasUnread && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={handleMarkAllRead}
              disabled={markAllRead.isPending}
              data-testid="btn-mark-all-read"
            >
              <CheckCheck className="h-3 w-3" />
              Mark all read
            </Button>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">Loading…</div>
          ) : items.length === 0 ? (
            <div className="p-6 text-center">
              <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-30" />
              <p className="text-sm text-muted-foreground">You're all caught up!</p>
            </div>
          ) : (
            items.map((notif) => (
              <div
                key={notif.id}
                className={cn(
                  "flex items-start gap-2 px-4 py-3 border-b last:border-0 cursor-pointer transition-colors",
                  notif.read ? "hover:bg-muted/50" : "bg-primary/5 hover:bg-primary/10"
                )}
                onClick={() => navigateToRelated(notif.type, notif.relatedEntityId)}
                data-testid={`notification-${notif.id}`}
              >
                <div className="flex-1 min-w-0 mt-0.5">
                  <div className="flex items-center">
                    {notificationIcon(notif.type)}
                    <p className={cn("text-xs leading-snug", !notif.read && "font-medium")}>
                      {notif.message}
                    </p>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                  </p>
                </div>
                {!notif.read && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground"
                    onClick={(e) => handleMarkRead(notif.id, e)}
                    title="Mark as read"
                    data-testid={`btn-mark-read-${notif.id}`}
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="px-4 py-2 border-t">
            <Button variant="link" size="sm" className="w-full h-7 text-xs" onClick={() => setLocation("/profile")}>
              View profile &amp; activity
            </Button>
          </div>
        )}
      </PopoverContent>
    </>
  );
}

export function TopNav() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearch(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { data: searchResults, isLoading: isSearching } = useGlobalSearch(
    { q: debouncedQuery, type: "all" },
    {
      query: {
        enabled: debouncedQuery.length >= 2,
        queryKey: getGlobalSearchQueryKey({ q: debouncedQuery, type: "all" }),
      },
    }
  );

  const hasResults =
    searchResults &&
    ((searchResults.events?.length ?? 0) > 0 || (searchResults.volunteers?.length ?? 0) > 0);

  const navigate = (path: string) => {
    setLocation(path);
    setSearchQuery("");
    setShowSearch(false);
  };

  if (!user) return null;

  return (
    <header className="h-16 border-b bg-card px-4 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-4 flex-1">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <Sidebar />
          </SheetContent>
        </Sheet>

        <div className="max-w-md w-full relative hidden sm:block" ref={searchRef}>
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            type="search"
            placeholder="Search volunteers, events…"
            className="pl-9 bg-muted border-none"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearch(true);
            }}
            onFocus={() => setShowSearch(true)}
            data-testid="input-global-search"
          />
          {showSearch && debouncedQuery.length >= 2 && (
            <div className="absolute top-full left-0 w-full mt-1 bg-popover border rounded-md shadow-lg py-1 z-50 max-h-96 overflow-y-auto">
              {isSearching ? (
                <div className="p-4 text-center text-sm text-muted-foreground">Searching…</div>
              ) : hasResults ? (
                <>
                  {searchResults.events && searchResults.events.length > 0 && (
                    <div>
                      <div className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Events
                      </div>
                      {searchResults.events.map((event) => (
                        <div
                          key={`event-${event.id}`}
                          className="px-3 py-2 hover:bg-muted cursor-pointer text-sm"
                          onClick={() => navigate(`/events/${event.id}`)}
                          data-testid={`search-event-${event.id}`}
                        >
                          <div className="font-medium">{event.title}</div>
                          {event.location && (
                            <div className="text-xs text-muted-foreground">{event.location}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {searchResults.volunteers && searchResults.volunteers.length > 0 && (
                    <div>
                      <div className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Volunteers
                      </div>
                      {searchResults.volunteers.map((vol) => (
                        <div
                          key={`vol-${vol.id}`}
                          className="px-3 py-2 hover:bg-muted cursor-pointer text-sm"
                          onClick={() => navigate(`/volunteers/${vol.id}`)}
                          data-testid={`search-volunteer-${vol.id}`}
                        >
                          <div className="font-medium">
                            {vol.firstName} {vol.lastName}
                          </div>
                          {vol.email && (
                            <div className="text-xs text-muted-foreground">{vol.email}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="p-4 text-center text-sm text-muted-foreground">No results found.</div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          data-testid="btn-theme-toggle"
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        <Popover>
          <NotificationsDropdown />
        </Popover>
      </div>
    </header>
  );
}

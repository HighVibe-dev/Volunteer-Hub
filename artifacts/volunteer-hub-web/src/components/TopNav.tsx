import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import {
  useGetUnreadNotificationCount,
  getGetUnreadNotificationCountQueryKey,
  useGlobalSearch,
  getGlobalSearchQueryKey,
} from "@workspace/api-client-react";
import { Bell, Search, Sun, Moon, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sidebar } from "./Sidebar";
import { Badge } from "@/components/ui/badge";

export function TopNav() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: unreadCount } = useGetUnreadNotificationCount({
    query: {
      refetchInterval: 30000,
      enabled: !!user,
      queryKey: getGetUnreadNotificationCountQueryKey(),
    }
  });

  const { data: searchResults, isLoading: isSearching } = useGlobalSearch(
    { q: debouncedQuery, type: "all" },
    { query: { enabled: debouncedQuery.length >= 2, queryKey: getGlobalSearchQueryKey({ q: debouncedQuery, type: "all" }) } }
  );

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

        <div className="max-w-md w-full relative hidden sm:block">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search volunteers, events..."
            className="pl-9 bg-muted border-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-global-search"
          />
          {debouncedQuery.length >= 2 && (
            <div className="absolute top-full left-0 w-full mt-1 bg-popover border rounded-md shadow-md py-2 z-50 max-h-96 overflow-y-auto">
              {isSearching ? (
                <div className="p-4 text-center text-sm text-muted-foreground">Searching...</div>
              ) : searchResults && (searchResults.volunteers?.length || searchResults.events?.length) ? (
                <>
                  {searchResults.events && searchResults.events.length > 0 && (
                    <div className="mb-2">
                      <div className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Events</div>
                      {searchResults.events.map(event => (
                        <div 
                          key={`event-${event.id}`}
                          className="px-3 py-2 hover:bg-muted cursor-pointer text-sm"
                          onClick={() => {
                            setLocation(`/events/${event.id}`);
                            setSearchQuery("");
                          }}
                        >
                          {event.title}
                        </div>
                      ))}
                    </div>
                  )}
                  {searchResults.volunteers && searchResults.volunteers.length > 0 && (
                    <div>
                      <div className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Volunteers</div>
                      {searchResults.volunteers.map(vol => (
                        <div 
                          key={`vol-${vol.id}`}
                          className="px-3 py-2 hover:bg-muted cursor-pointer text-sm"
                          onClick={() => {
                            setLocation(`/volunteers/${vol.id}`);
                            setSearchQuery("");
                          }}
                        >
                          {vol.firstName} {vol.lastName}
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
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative" data-testid="btn-notifications">
              <Bell className="h-5 w-5" />
              {unreadCount && unreadCount.count > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground">
                  {unreadCount.count > 99 ? '99+' : unreadCount.count}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80">
            <div className="text-sm font-medium mb-2">Notifications</div>
            <div className="text-sm text-muted-foreground">Notifications will appear here.</div>
            <Button variant="link" className="w-full mt-2" size="sm" onClick={() => setLocation("/dashboard")}>
              View All
            </Button>
          </PopoverContent>
        </Popover>
      </div>
    </header>
  );
}

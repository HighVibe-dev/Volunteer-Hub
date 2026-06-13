import { useState } from "react";
import { Link } from "wouter";
import {
  useListEvents,
  getListEventsQueryKey,
  useApplyToEvent,
  useWithdrawApplication,
  useDeleteEvent,
  useCancelEvent,
  ListEventsStatus,
} from "@workspace/api-client-react";
import type { ListEventsParams } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, ChevronLeft, ChevronRight, CalendarDays, MapPin, Users } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  UPCOMING: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  ONGOING: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  COMPLETED: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export default function Events() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("all");
  const isStaff = user?.role === "ADMIN" || user?.role === "COORDINATOR";

  const params: ListEventsParams = {
    page,
    size: 12,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(status && status !== "all" ? { status: status as typeof ListEventsStatus[keyof typeof ListEventsStatus] } : {}),
  };

  const { data, isLoading } = useListEvents(params, {
    query: { queryKey: getListEventsQueryKey(params) },
  });

  const applyMutation = useApplyToEvent();
  const withdrawMutation = useWithdrawApplication();
  const deleteMutation = useDeleteEvent();
  const cancelMutation = useCancelEvent();

  const handleSearch = (val: string) => {
    setSearch(val);
    clearTimeout((window as any).__esearchTimer);
    (window as any).__esearchTimer = setTimeout(() => {
      setDebouncedSearch(val);
      setPage(0);
    }, 300);
  };

  const handleApply = (eventId: number) => {
    applyMutation.mutate({ data: { eventId } }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListEventsQueryKey(params) });
        toast({ title: "Applied successfully!" });
      },
      onError: () => toast({ variant: "destructive", title: "Could not apply" }),
    });
  };

  const handleCancel = (eventId: number) => {
    cancelMutation.mutate({ eventId }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListEventsQueryKey(params) });
        toast({ title: "Event cancelled" });
      },
      onError: () => toast({ variant: "destructive", title: "Failed to cancel event" }),
    });
  };

  const handleDelete = (eventId: number) => {
    if (!confirm("Delete this event? This action cannot be undone.")) return;
    deleteMutation.mutate({ eventId }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListEventsQueryKey(params) });
        toast({ title: "Event deleted" });
      },
      onError: () => toast({ variant: "destructive", title: "Failed to delete event" }),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Events</h1>
          <p className="text-muted-foreground">Browse and manage volunteer events</p>
        </div>
        {isStaff && (
          <Link href="/events/new">
            <Button data-testid="btn-create-event">
              <Plus className="h-4 w-4 mr-2" />
              New Event
            </Button>
          </Link>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search events..."
            className="pl-9"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            data-testid="input-event-search"
          />
        </div>
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(0); }}>
          <SelectTrigger className="w-40" data-testid="select-event-status">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="UPCOMING">Upcoming</SelectItem>
            <SelectItem value="ONGOING">Ongoing</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48 rounded-lg" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data?.content?.map((event) => (
              <Card key={event.id} className="flex flex-col hover:shadow-md transition-shadow" data-testid={`card-event-${event.id}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base line-clamp-2">{event.title}</CardTitle>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full shrink-0 ${STATUS_COLORS[event.status] ?? ""}`}>
                      {event.status}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col flex-1 gap-3">
                  <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                      <span>{new Date(event.startDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{event.location}</span>
                    </div>
                    {event.maxParticipants && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="h-3.5 w-3.5 shrink-0" />
                        <span>{event.currentParticipants} / {event.maxParticipants}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 mt-auto pt-2">
                    <Link href={`/events/${event.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full" data-testid={`btn-view-event-${event.id}`}>
                        View
                      </Button>
                    </Link>
                    {user?.role === "VOLUNTEER" && event.status === "UPCOMING" && (
                      event.isApplied ? (
                        <Button size="sm" variant="destructive" className="flex-1" onClick={() => {}} disabled data-testid={`btn-applied-event-${event.id}`}>
                          Applied
                        </Button>
                      ) : (
                        <Button size="sm" className="flex-1" onClick={() => handleApply(event.id)} disabled={applyMutation.isPending} data-testid={`btn-apply-event-${event.id}`}>
                          Apply
                        </Button>
                      )
                    )}
                    {isStaff && (
                      <Link href={`/events/${event.id}/edit`}>
                        <Button size="sm" variant="secondary" data-testid={`btn-edit-event-${event.id}`}>Edit</Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            {(!data?.content || data.content.length === 0) && (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                No events found.
              </div>
            )}
          </div>

          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {data.number + 1} of {data.totalPages} ({data.totalElements} events)
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={data.first} data-testid="btn-events-prev">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={data.last} data-testid="btn-events-next">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

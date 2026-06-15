import bannerBg from "@assets/coordinator-banner-generated.png";
import {
  useGetDashboardStats,
  getGetDashboardStatsQueryKey,
  useListEvents,
  getListEventsQueryKey,
  useListApplications,
  getListApplicationsQueryKey,
  useUpdateApplicationStatus,
  ListEventsStatus,
  ListApplicationsStatus,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Users, Calendar, Clock, ClipboardList, CheckSquare } from "lucide-react";
import { Link } from "wouter";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

function StatCard({ title, value, icon: Icon, description }: {
  title: string; value: string | number; icon: any; description?: string;
}) {
  return (
    <Card data-testid={`stat-card-${title.toLowerCase().replace(/\s+/g, "-")}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </CardContent>
    </Card>
  );
}

export default function CoordinatorDashboard() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: stats, isLoading } = useGetDashboardStats({
    query: { enabled: !!user, queryKey: getGetDashboardStatsQueryKey() },
  });

  const { data: upcomingEvents } = useListEvents(
    { status: ListEventsStatus.UPCOMING, size: 5 },
    { query: { enabled: !!user, queryKey: getListEventsQueryKey({ status: ListEventsStatus.UPCOMING, size: 5 }) } }
  );

  const { data: ongoingEvents } = useListEvents(
    { status: ListEventsStatus.ONGOING, size: 3 },
    { query: { enabled: !!user, queryKey: getListEventsQueryKey({ status: ListEventsStatus.ONGOING, size: 3 }) } }
  );

  const { data: pendingApps } = useListApplications(
    { status: ListApplicationsStatus.PENDING, size: 10 },
    { query: { enabled: !!user, queryKey: getListApplicationsQueryKey({ status: ListApplicationsStatus.PENDING, size: 10 }) } }
  );

  const approveApp = useUpdateApplicationStatus();

  const handleQuickApprove = (appId: number) => {
    approveApp.mutate({ applicationId: appId, data: { status: "APPROVED" } }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListApplicationsQueryKey({ status: ListApplicationsStatus.PENDING, size: 10 }) });
        toast({ title: "Application approved" });
      },
      onError: () => toast({ variant: "destructive", title: "Failed to approve" }),
    });
  };

  const upcomingChartData = upcomingEvents?.content?.slice(0, 5).map((e) => ({
    name: e.title.slice(0, 12),
    spots: e.maxParticipants ? e.maxParticipants - (e.currentParticipants ?? 0) : 0,
    enrolled: e.currentParticipants ?? 0,
  })) ?? [];

  if (isLoading || !stats) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 rounded-lg" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div
        className="relative w-full rounded-2xl overflow-hidden"
        style={{ backgroundImage: `url(${bannerBg})`, backgroundSize: "cover", backgroundPosition: "center 30%", minHeight: 200 }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/82 via-black/55 to-black/15" />
        <div className="relative z-10 flex flex-col justify-end p-6 min-h-[200px]">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">Coordinator Dashboard</h1>
          <p className="text-white/75 text-sm">Welcome back, {user?.firstName}. Here's your coordination summary.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Active Volunteers" value={stats.activeVolunteers} icon={Users} description="Available for events" />
        <StatCard title="Upcoming Events" value={stats.upcomingEvents} icon={Calendar} description="Needs coordination" />
        <StatCard title="Pending Applications" value={stats.pendingApplications} icon={ClipboardList} description="Needs review" />
        <StatCard title="Hours This Period" value={`${stats.totalHoursLogged}h`} icon={Clock} description="Total logged" />
      </div>

      {ongoingEvents?.content && ongoingEvents.content.length > 0 && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
          <CardHeader>
            <CardTitle className="text-base text-green-700 dark:text-green-400 flex items-center gap-2">
              <CheckSquare className="h-4 w-4" />
              Ongoing Events — Check In Volunteers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {ongoingEvents.content.map((event) => (
                <Link href={`/events/${event.id}`} key={event.id}>
                  <div className="p-3 bg-white dark:bg-card rounded-lg border border-green-200 hover:shadow-sm cursor-pointer transition-shadow" data-testid={`ongoing-event-${event.id}`}>
                    <div className="font-medium text-sm">{event.title}</div>
                    <div className="text-xs text-muted-foreground mt-1">{event.location}</div>
                    <div className="text-xs text-green-600 font-medium mt-2">{event.currentParticipants ?? 0} enrolled · Click to check in</div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Event Enrollment Status</CardTitle>
            <Link href="/events"><span className="text-xs text-primary hover:underline cursor-pointer">All events</span></Link>
          </CardHeader>
          <CardContent>
            {upcomingChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={upcomingChartData} margin={{ bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-15} textAnchor="end" />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Bar dataKey="enrolled" name="Enrolled" fill="#2d6a4f" radius={[4, 4, 0, 0]} stackId="a" />
                  <Bar dataKey="spots" name="Open Spots" fill="#3F746A" radius={[4, 4, 0, 0]} stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">No upcoming events yet.</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Applications Awaiting Review</CardTitle>
            <Link href="/applications"><span className="text-xs text-primary hover:underline cursor-pointer">View all</span></Link>
          </CardHeader>
          <CardContent>
            {pendingApps?.content && pendingApps.content.length > 0 ? (
              <div className="space-y-2 max-h-[280px] overflow-y-auto">
                {pendingApps.content.map((app) => (
                  <div key={app.id} className="flex items-center justify-between py-2 border-b last:border-0" data-testid={`coord-app-${app.id}`}>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{app.volunteerName}</div>
                      <div className="text-xs text-muted-foreground truncate">{app.eventTitle}</div>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <Button
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => handleQuickApprove(app.id)}
                        disabled={approveApp.isPending}
                        data-testid={`btn-quick-approve-${app.id}`}
                      >
                        Approve
                      </Button>
                      <Link href={`/events/${app.eventId}`}>
                        <Button variant="outline" size="sm" className="h-7 text-xs">View</Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No pending applications. All caught up!
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import {
  useGetDashboardStats,
  getGetDashboardStatsQueryKey,
  useGetLeaderboard,
  getGetLeaderboardQueryKey,
  useListEvents,
  getListEventsQueryKey,
  useListApplications,
  getListApplicationsQueryKey,
  useListCertificates,
  getListCertificatesQueryKey,
  useGetMyProfile,
  getGetMyProfileQueryKey,
  ListEventsStatus,
} from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Award, ClipboardList, Trophy, CalendarDays, MapPin } from "lucide-react";
import { Link } from "wouter";
import {
  RadialBarChart, RadialBar, ResponsiveContainer, Tooltip,
} from "recharts";

export default function VolunteerDashboard() {
  const { user } = useAuth();

  const { data: stats, isLoading } = useGetDashboardStats({
    query: { enabled: !!user, queryKey: getGetDashboardStatsQueryKey() },
  });

  const { data: profile } = useGetMyProfile({
    query: { queryKey: getGetMyProfileQueryKey() },
  });

  const { data: myApplications } = useListApplications(
    { size: 5 },
    { query: { enabled: !!user, queryKey: getListApplicationsQueryKey({ size: 5 }) } }
  );

  const { data: certificates } = useListCertificates(
    { size: 5 },
    { query: { enabled: !!user, queryKey: getListCertificatesQueryKey({ size: 5 }) } }
  );

  const { data: upcomingEvents } = useListEvents(
    { status: ListEventsStatus.UPCOMING, size: 3 },
    { query: { enabled: !!user, queryKey: getListEventsQueryKey({ status: ListEventsStatus.UPCOMING, size: 3 }) } }
  );

  const { data: leaderboard } = useGetLeaderboard(
    { limit: 10, period: "all-time" },
    { query: { enabled: !!user, queryKey: getGetLeaderboardQueryKey({ limit: 10, period: "all-time" }) } }
  );

  const myRank = leaderboard?.findIndex((e) => e.volunteerId === user?.userId);
  const myLeaderboardEntry = myRank !== undefined && myRank >= 0 ? leaderboard?.[myRank] : null;

  const progressData = [
    {
      name: "Hours",
      value: Math.min(100, ((profile?.totalHoursLogged ?? 0) / 100) * 100),
      fill: "#EE7F31",
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-lg" />)}
        </div>
      </div>
    );
  }

  const appStatusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    APPROVED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
    WITHDRAWN: "bg-gray-100 text-gray-600",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user?.firstName}! Keep up the great work.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card data-testid="stat-card-my-hours">
          <CardContent className="pt-6 text-center">
            <Clock className="h-6 w-6 text-primary mx-auto mb-2" />
            <div className="text-3xl font-bold">{profile?.totalHoursLogged ?? 0}</div>
            <div className="text-sm text-muted-foreground">Hours Volunteered</div>
          </CardContent>
        </Card>
        <Card data-testid="stat-card-events-attended">
          <CardContent className="pt-6 text-center">
            <Calendar className="h-6 w-6 text-primary mx-auto mb-2" />
            <div className="text-3xl font-bold">{profile?.eventsAttended ?? 0}</div>
            <div className="text-sm text-muted-foreground">Events Attended</div>
          </CardContent>
        </Card>
        <Card data-testid="stat-card-certificates">
          <CardContent className="pt-6 text-center">
            <Award className="h-6 w-6 text-primary mx-auto mb-2" />
            <div className="text-3xl font-bold">{certificates?.totalElements ?? 0}</div>
            <div className="text-sm text-muted-foreground">Certificates Earned</div>
          </CardContent>
        </Card>
      </div>

      {myLeaderboardEntry && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Trophy className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="font-semibold text-lg">Rank #{(myRank ?? 0) + 1} on the Leaderboard</div>
                <div className="text-sm text-muted-foreground">
                  {myLeaderboardEntry.totalHoursLogged}h · {myLeaderboardEntry.eventsAttended} events
                  {myLeaderboardEntry.badge && ` · ${myLeaderboardEntry.badge}`}
                </div>
              </div>
              <Link href="/leaderboard" className="ml-auto">
                <Button variant="outline" size="sm" data-testid="btn-view-leaderboard">View Full Leaderboard</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Upcoming Events</CardTitle>
            <Link href="/events"><span className="text-xs text-primary hover:underline cursor-pointer">Browse all</span></Link>
          </CardHeader>
          <CardContent>
            {upcomingEvents?.content && upcomingEvents.content.length > 0 ? (
              <div className="space-y-3">
                {upcomingEvents.content.map((event) => (
                  <Link href={`/events/${event.id}`} key={event.id}>
                    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors" data-testid={`vol-dashboard-event-${event.id}`}>
                      <div className="p-2 bg-primary/10 rounded-md shrink-0">
                        <Calendar className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-sm truncate">{event.title}</div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <CalendarDays className="h-3 w-3" />
                          {new Date(event.startDate).toLocaleDateString()}
                          <MapPin className="h-3 w-3 ml-1" />
                          <span className="truncate">{event.location}</span>
                        </div>
                        {event.isApplied && (
                          <span className="text-xs text-green-600 font-medium">Applied</span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">No upcoming events scheduled.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">My Applications</CardTitle>
            <Link href="/applications"><span className="text-xs text-primary hover:underline cursor-pointer">View all</span></Link>
          </CardHeader>
          <CardContent>
            {myApplications?.content && myApplications.content.length > 0 ? (
              <div className="space-y-2">
                {myApplications.content.map((app) => (
                  <div key={app.id} className="flex items-center justify-between py-2 border-b last:border-0" data-testid={`vol-dashboard-app-${app.id}`}>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{app.eventTitle}</div>
                      <div className="text-xs text-muted-foreground">{new Date(app.appliedAt).toLocaleDateString()}</div>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ml-2 ${appStatusColors[app.status] ?? ""}`}>
                      {app.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <ClipboardList className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-30" />
                <p className="text-sm text-muted-foreground">No applications yet.</p>
                <Link href="/events">
                  <Button variant="link" size="sm" className="mt-1">Browse events</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {certificates?.content && certificates.content.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">My Certificates</CardTitle>
            <Link href="/certificates"><span className="text-xs text-primary hover:underline cursor-pointer">View all</span></Link>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {certificates.content.map((cert) => (
                <div key={cert.id} className="flex items-center gap-3 p-3 rounded-lg border" data-testid={`vol-dashboard-cert-${cert.id}`}>
                  <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                    <Award className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{cert.eventTitle}</div>
                    <div className="text-xs text-muted-foreground">{new Date(cert.issuedAt).toLocaleDateString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

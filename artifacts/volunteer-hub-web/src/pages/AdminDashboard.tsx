import bannerBg from "@assets/admin-banner-generated.png";
import {
  useGetDashboardStats,
  getGetDashboardStatsQueryKey,
  useGetDashboardTrends,
  getGetDashboardTrendsQueryKey,
  useGetLeaderboard,
  getGetLeaderboardQueryKey,
  useListEvents,
  getListEventsQueryKey,
  useListApplications,
  getListApplicationsQueryKey,
  ListEventsStatus,
  ListApplicationsStatus,
} from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Calendar, Award, Clock, ClipboardList, TrendingUp, CalendarDays, MapPin, CheckCircle } from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import { Link } from "wouter";

const CHART_COLORS = ["#2d6a4f", "#3F746A", "#E8C547", "#6366F1"];

function StatCard({ title, value, icon: Icon, description, variant = "default" }: {
  title: string; value: string | number; icon: any; description?: string; variant?: "default" | "warning" | "success";
}) {
  return (
    <Card data-testid={`stat-card-${title.toLowerCase().replace(/\s+/g, "-")}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${variant === "warning" ? "text-yellow-600" : variant === "success" ? "text-green-600" : ""}`}>{value}</div>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();

  const { data: stats, isLoading } = useGetDashboardStats({
    query: { enabled: !!user, queryKey: getGetDashboardStatsQueryKey() },
  });

  const { data: trends } = useGetDashboardTrends(
    { months: 6 },
    { query: { enabled: !!user, queryKey: getGetDashboardTrendsQueryKey({ months: 6 }) } }
  );

  const { data: leaderboard } = useGetLeaderboard(
    { limit: 5, period: "all-time" },
    { query: { enabled: !!user, queryKey: getGetLeaderboardQueryKey({ limit: 5, period: "all-time" }) } }
  );

  const { data: upcomingEvents } = useListEvents(
    { status: ListEventsStatus.UPCOMING, size: 3 },
    { query: { enabled: !!user, queryKey: getListEventsQueryKey({ status: ListEventsStatus.UPCOMING, size: 3 }) } }
  );

  const { data: pendingApps } = useListApplications(
    { status: ListApplicationsStatus.PENDING, size: 5 },
    { query: { enabled: !!user, queryKey: getListApplicationsQueryKey({ status: ListApplicationsStatus.PENDING, size: 5 }) } }
  );

  if (isLoading || !stats) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 rounded-lg" />)}
        </div>
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  const volunteerPieData = [
    { name: "Active", value: stats.activeVolunteers },
    { name: "Inactive", value: stats.totalVolunteers - stats.activeVolunteers - (stats.pendingVolunteers ?? 0) },
    { name: "Pending", value: stats.pendingVolunteers ?? 0 },
  ].filter((d) => d.value > 0);

  const eventPieData = [
    { name: "Upcoming", value: stats.upcomingEvents },
    { name: "Ongoing", value: stats.ongoingEvents ?? 0 },
    { name: "Completed", value: stats.completedEvents },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      <div
        className="relative w-full rounded-2xl overflow-hidden"
        style={{ backgroundImage: `url(${bannerBg})`, backgroundSize: "cover", backgroundPosition: "center 30%", minHeight: 200 }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/82 via-black/55 to-black/15" />
        <div className="relative z-10 flex flex-col justify-end p-6 min-h-[200px]">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">Admin Dashboard</h1>
          <p className="text-white/75 text-sm">Organization overview for NayePankh Foundation</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Volunteers" value={stats.totalVolunteers} icon={Users} description={`${stats.activeVolunteers} active`} />
        <StatCard title="Total Hours" value={`${stats.totalHoursLogged ?? 0}h`} icon={Clock} description="Hours volunteered" variant="success" />
        <StatCard title="Total Events" value={stats.totalEvents} icon={Calendar} description={`${stats.upcomingEvents ?? 0} upcoming`} />
        <StatCard title="Pending Applications" value={stats.pendingApplications} icon={ClipboardList} description="Awaiting review" variant={stats.pendingApplications > 0 ? "warning" : "default"} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6 text-center">
            <Award className="h-6 w-6 text-primary mx-auto mb-1" />
            <div className="text-2xl font-bold">{stats.certificatesIssued}</div>
            <div className="text-xs text-muted-foreground">Certificates Issued</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-1" />
            <div className="text-2xl font-bold">{stats.completedEvents}</div>
            <div className="text-xs text-muted-foreground">Completed Events</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <TrendingUp className="h-6 w-6 text-blue-500 mx-auto mb-1" />
            <div className="text-2xl font-bold">{stats.ongoingEvents ?? 0}</div>
            <div className="text-xs text-muted-foreground">Ongoing Events</div>
          </CardContent>
        </Card>
      </div>

      {trends && trends.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-7">
          <Card className="lg:col-span-4">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Activity Trends (Last 6 Months)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={trends} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                  <defs>
                    <linearGradient id="colorVolAdm" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2d6a4f" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#2d6a4f" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorHrsAdm" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3F746A" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3F746A" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Area type="monotone" dataKey="volunteers" name="Volunteers" stroke="#2d6a4f" fill="url(#colorVolAdm)" strokeWidth={2} />
                  <Area type="monotone" dataKey="hoursLogged" name="Hours" stroke="#3F746A" fill="url(#colorHrsAdm)" strokeWidth={2} />
                  <Area type="monotone" dataKey="eventsHeld" name="Events" stroke="#6366F1" fill="none" strokeWidth={1.5} strokeDasharray="4 2" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="lg:col-span-3">
            <CardHeader><CardTitle className="text-base">Volunteer Status Breakdown</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={volunteerPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={2}>
                    {volunteerPieData.map((_, idx) => (
                      <Cell key={idx} fill={CHART_COLORS[idx]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: number) => [val, "Volunteers"]} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-1.5">
                {eventPieData.map((d, idx) => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: CHART_COLORS[idx] }} />
                      <span>{d.name} Events</span>
                    </div>
                    <span className="font-medium">{d.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {trends && trends.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Monthly Certificates Issued</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={trends} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Bar dataKey="certificatesIssued" name="Certificates" fill="#E8C547" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Upcoming Events</CardTitle>
            <Link href="/events"><span className="text-xs text-primary hover:underline cursor-pointer">View all</span></Link>
          </CardHeader>
          <CardContent>
            {upcomingEvents?.content && upcomingEvents.content.length > 0 ? (
              <div className="space-y-3">
                {upcomingEvents.content.map((event) => (
                  <Link href={`/events/${event.id}`} key={event.id}>
                    <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer" data-testid={`dashboard-event-${event.id}`}>
                      <Calendar className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <div className="font-medium text-sm truncate">{event.title}</div>
                        <div className="text-xs text-muted-foreground">{new Date(event.startDate).toLocaleDateString()} · {event.location}</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">No upcoming events.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Pending Applications</CardTitle>
            <Link href="/applications"><span className="text-xs text-primary hover:underline cursor-pointer">Review all</span></Link>
          </CardHeader>
          <CardContent>
            {pendingApps?.content && pendingApps.content.length > 0 ? (
              <div className="space-y-2">
                {pendingApps.content.map((app) => (
                  <div key={app.id} className="flex items-center justify-between py-1.5 border-b last:border-0" data-testid={`dashboard-app-${app.id}`}>
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{app.volunteerName}</div>
                      <div className="text-xs text-muted-foreground truncate">{app.eventTitle}</div>
                    </div>
                    <Link href={`/events/${app.eventId}`}>
                      <Button variant="ghost" size="sm" className="h-7 text-xs">Review</Button>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">No pending applications.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Top Volunteers</CardTitle>
            <Link href="/leaderboard"><span className="text-xs text-primary hover:underline cursor-pointer">Leaderboard</span></Link>
          </CardHeader>
          <CardContent>
            {leaderboard && leaderboard.length > 0 ? (
              <div className="space-y-2">
                {leaderboard.map((entry, idx) => (
                  <div key={entry.volunteerId} className="flex items-center gap-2" data-testid={`dashboard-leader-${entry.volunteerId}`}>
                    <div className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold shrink-0 ${idx === 0 ? "bg-amber-100 text-amber-700" : idx === 1 ? "bg-gray-100 text-gray-700" : "bg-orange-100 text-orange-700"}`}>
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{entry.firstName} {entry.lastName}</div>
                    </div>
                    <div className="text-xs font-bold">{entry.totalHoursLogged}h</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">No data yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { useAuth } from "@/contexts/AuthContext";
import {
  useGetDashboardStats,
  getGetDashboardStatsQueryKey,
  useGetDashboardTrends,
  getGetDashboardTrendsQueryKey,
  useGetLeaderboard,
  getGetLeaderboardQueryKey,
  useListEvents,
  getListEventsQueryKey,
  ListEventsStatus,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar, Award, Clock, ClipboardList, TrendingUp, CalendarDays, MapPin } from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import { Link } from "wouter";

const CHART_COLORS = ["#EE7F31", "#3F746A", "#E8C547", "#6366F1"];

function StatCard({
  title, value, icon: Icon, description, trend,
}: {
  title: string;
  value: string | number;
  icon: any;
  description?: string;
  trend?: number;
}) {
  return (
    <Card>
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

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-[60px]" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Skeleton className="h-[300px] w-full" />
    </div>
  );
}

const EVENT_STATUS_COLORS: Record<string, string> = {
  UPCOMING: "bg-blue-100 text-blue-800",
  ONGOING: "bg-green-100 text-green-800",
  COMPLETED: "bg-gray-100 text-gray-600",
  CANCELLED: "bg-red-100 text-red-700",
};

export default function Dashboard() {
  const { user } = useAuth();
  const isStaff = user?.role === "ADMIN" || user?.role === "COORDINATOR";

  const { data: stats, isLoading } = useGetDashboardStats({
    query: { enabled: !!user, queryKey: getGetDashboardStatsQueryKey() },
  });

  const { data: trends } = useGetDashboardTrends(
    { months: 6 },
    { query: { enabled: !!user && isStaff, queryKey: getGetDashboardTrendsQueryKey({ months: 6 }) } }
  );

  const { data: leaderboard } = useGetLeaderboard(
    { limit: 5, period: "all-time" },
    { query: { enabled: !!user, queryKey: getGetLeaderboardQueryKey({ limit: 5, period: "all-time" }) } }
  );

  const { data: upcomingEvents } = useListEvents(
    { status: ListEventsStatus.UPCOMING, size: 4 },
    { query: { enabled: !!user, queryKey: getListEventsQueryKey({ status: ListEventsStatus.UPCOMING, size: 4 }) } }
  );

  if (isLoading || !stats) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
        <DashboardSkeleton />
      </div>
    );
  }

  const pieData = [
    { name: "Active", value: stats.activeVolunteers },
    { name: "Inactive", value: stats.totalVolunteers - stats.activeVolunteers },
  ];

  const eventPieData = [
    { name: "Upcoming", value: stats.upcomingEvents },
    { name: "Completed", value: stats.completedEvents },
    { name: "Ongoing", value: stats.ongoingEvents ?? 0 },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.firstName}. Here's what's happening at NayePankh.
        </p>
      </div>

      {isStaff && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Volunteers" value={stats.totalVolunteers} icon={Users} description={`${stats.activeVolunteers} active`} />
          <StatCard title="Total Hours" value={stats.totalHoursLogged} icon={Clock} description="Hours volunteered" />
          <StatCard title="Total Events" value={stats.totalEvents} icon={Calendar} description={`${stats.upcomingEvents} upcoming`} />
          <StatCard title="Pending Applications" value={stats.pendingApplications} icon={ClipboardList} description="Awaiting review" />
        </div>
      )}

      {user?.role === "VOLUNTEER" && (
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard title="Hours This Month" value={stats.totalHoursLogged} icon={Clock} />
          <StatCard title="Events Attended" value={stats.completedEvents} icon={Calendar} />
          <StatCard title="Certificates" value={stats.certificatesIssued} icon={Award} />
        </div>
      )}

      {isStaff && trends && trends.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="lg:col-span-4">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Volunteer Activity (Last 6 Months)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={trends} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                  <defs>
                    <linearGradient id="colorVolunteers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EE7F31" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#EE7F31" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3F746A" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3F746A" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Area type="monotone" dataKey="volunteers" name="Volunteers" stroke="#EE7F31" fill="url(#colorVolunteers)" strokeWidth={2} />
                  <Area type="monotone" dataKey="hoursLogged" name="Hours" stroke="#3F746A" fill="url(#colorHours)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="text-base">Volunteer Status</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                    {pieData.map((_, idx) => (
                      <Cell key={idx} fill={CHART_COLORS[idx]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 space-y-1">
                {eventPieData.map((d, idx) => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: CHART_COLORS[idx] }} />
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

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Upcoming Events</CardTitle>
            <Link href="/events">
              <span className="text-xs text-primary hover:underline cursor-pointer">View all</span>
            </Link>
          </CardHeader>
          <CardContent>
            {upcomingEvents?.content && upcomingEvents.content.length > 0 ? (
              <div className="space-y-3">
                {upcomingEvents.content.map((event) => (
                  <Link href={`/events/${event.id}`} key={event.id}>
                    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer" data-testid={`dashboard-event-${event.id}`}>
                      <div className="p-2 bg-primary/10 rounded-md shrink-0">
                        <Calendar className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{event.title}</div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <CalendarDays className="h-3 w-3" />
                          {new Date(event.startDate).toLocaleDateString()}
                          <MapPin className="h-3 w-3 ml-1" />
                          <span className="truncate">{event.location}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No upcoming events scheduled.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Top Volunteers</CardTitle>
            <Link href="/leaderboard">
              <span className="text-xs text-primary hover:underline cursor-pointer">Leaderboard</span>
            </Link>
          </CardHeader>
          <CardContent>
            {leaderboard && leaderboard.length > 0 ? (
              <div className="space-y-3">
                {leaderboard.map((entry, idx) => (
                  <div key={entry.volunteerId} className="flex items-center gap-3" data-testid={`dashboard-leaderboard-${entry.volunteerId}`}>
                    <div className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold shrink-0 ${
                      idx === 0 ? "bg-amber-100 text-amber-700" :
                      idx === 1 ? "bg-gray-100 text-gray-600" :
                      idx === 2 ? "bg-orange-100 text-orange-700" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {idx + 1}
                    </div>
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                      {entry.firstName[0]}{entry.lastName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{entry.firstName} {entry.lastName}</div>
                      {entry.badge && <div className="text-xs text-primary">{entry.badge}</div>}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold">{entry.totalHoursLogged}h</div>
                      <div className="text-xs text-muted-foreground">{entry.eventsAttended} events</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No leaderboard data yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

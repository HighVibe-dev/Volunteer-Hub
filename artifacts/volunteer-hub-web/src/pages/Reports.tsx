import {
  useGetVolunteerParticipationReport,
  getGetVolunteerParticipationReportQueryKey,
  useGetAttendanceReport,
  getGetAttendanceReportQueryKey,
  useGetEventsReport,
  getGetEventsReportQueryKey,
  useGetSkillDistributionReport,
  getGetSkillDistributionReportQueryKey,
} from "@workspace/api-client-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area,
} from "recharts";

const COLORS = ["#EE7F31", "#3F746A", "#E8C547", "#6366F1", "#EC4899", "#14B8A6"];

function ParticipationReport() {
  const { data, isLoading } = useGetVolunteerParticipationReport(
    { size: 20 },
    { query: { queryKey: getGetVolunteerParticipationReportQueryKey({ size: 20 }) } }
  );

  const chartData = data?.content?.slice(0, 10).map((v) => ({
    name: `${v.firstName} ${v.lastName[0]}.`,
    hours: v.totalHoursLogged,
    events: v.eventsAttended,
  })) ?? [];

  if (isLoading) return <Skeleton className="h-80 w-full" />;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-base">Top Volunteers by Hours</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Bar dataKey="hours" name="Hours" fill="#EE7F31" radius={[4, 4, 0, 0]} />
              <Bar dataKey="events" name="Events" fill="#3F746A" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Volunteer Participation Table</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Volunteer</th>
                  <th className="px-4 py-3 text-right font-medium">Events</th>
                  <th className="px-4 py-3 text-right font-medium">Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data?.content?.map((v) => (
                  <tr key={v.volunteerId} className="hover:bg-muted/30" data-testid={`row-report-volunteer-${v.volunteerId}`}>
                    <td className="px-4 py-2">
                      <div className="font-medium">{v.firstName} {v.lastName}</div>
                      <div className="text-xs text-muted-foreground">{v.email}</div>
                    </td>
                    <td className="px-4 py-2 text-right">{v.eventsAttended}</td>
                    <td className="px-4 py-2 text-right font-medium">{v.totalHoursLogged}h</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AttendanceReport() {
  const { data, isLoading } = useGetAttendanceReport({}, {
    query: { queryKey: getGetAttendanceReportQueryKey({}) },
  });

  const chartData = data?.slice(0, 8).map((e) => ({
    name: e.eventTitle.slice(0, 15),
    checkedIn: e.totalCheckedIn,
    hours: e.totalHours,
    rate: Math.round(e.checkInRate * 100),
  })) ?? [];

  if (isLoading) return <Skeleton className="h-80 w-full" />;

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Attendance by Event</CardTitle></CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={{ fontSize: 12 }} />
            <Bar dataKey="checkedIn" name="Checked In" fill="#EE7F31" radius={[4, 4, 0, 0]} />
            <Bar dataKey="hours" name="Total Hours" fill="#3F746A" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function EventsReport() {
  const { data, isLoading } = useGetEventsReport({}, {
    query: { queryKey: getGetEventsReportQueryKey({}) },
  });

  const statusCounts = (data ?? []).reduce<Record<string, number>>((acc, e) => {
    acc[e.status] = (acc[e.status] ?? 0) + 1;
    return acc;
  }, {});

  const pieData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

  if (isLoading) return <Skeleton className="h-80 w-full" />;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader><CardTitle className="text-base">Events by Status</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                {pieData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Events Summary</CardTitle></CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Event</th>
                <th className="px-4 py-3 text-right font-medium">Participants</th>
                <th className="px-4 py-3 text-right font-medium">Hours</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data?.slice(0, 10).map((e) => (
                <tr key={e.eventId} className="hover:bg-muted/30" data-testid={`row-report-event-${e.eventId}`}>
                  <td className="px-4 py-2">
                    <div className="font-medium text-sm">{e.title}</div>
                    <div className="text-xs text-muted-foreground">{e.status}</div>
                  </td>
                  <td className="px-4 py-2 text-right">{e.participantCount}</td>
                  <td className="px-4 py-2 text-right font-medium">{e.hoursLogged}h</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

function SkillDistribution() {
  const { data, isLoading } = useGetSkillDistributionReport({
    query: { queryKey: getGetSkillDistributionReportQueryKey() },
  });

  const pieData = data?.slice(0, 8).map((s) => ({ name: s.skillName, value: s.volunteerCount })) ?? [];

  if (isLoading) return <Skeleton className="h-80 w-full" />;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader><CardTitle className="text-base">Skills Distribution</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={100} dataKey="value" label={({ name }) => name}>
                {pieData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => [v, "Volunteers"]} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Skill Breakdown</CardTitle></CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Skill</th>
                <th className="px-4 py-3 text-right font-medium">Volunteers</th>
                <th className="px-4 py-3 text-right font-medium">%</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data?.map((s) => (
                <tr key={s.skillId} className="hover:bg-muted/30" data-testid={`row-report-skill-${s.skillId}`}>
                  <td className="px-4 py-2 font-medium">{s.skillName}</td>
                  <td className="px-4 py-2 text-right">{s.volunteerCount}</td>
                  <td className="px-4 py-2 text-right">{s.percentage.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Reports() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground">Analytics and insights for the foundation</p>
      </div>

      <Tabs defaultValue="participation">
        <TabsList>
          <TabsTrigger value="participation" data-testid="tab-participation">Volunteer Participation</TabsTrigger>
          <TabsTrigger value="attendance" data-testid="tab-attendance">Attendance</TabsTrigger>
          <TabsTrigger value="events" data-testid="tab-events">Events</TabsTrigger>
          <TabsTrigger value="skills" data-testid="tab-skills">Skill Distribution</TabsTrigger>
        </TabsList>
        <TabsContent value="participation" className="mt-6"><ParticipationReport /></TabsContent>
        <TabsContent value="attendance" className="mt-6"><AttendanceReport /></TabsContent>
        <TabsContent value="events" className="mt-6"><EventsReport /></TabsContent>
        <TabsContent value="skills" className="mt-6"><SkillDistribution /></TabsContent>
      </Tabs>
    </div>
  );
}

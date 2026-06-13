import { useState } from "react";
import {
  useGetLeaderboard,
  getGetLeaderboardQueryKey,
  GetLeaderboardPeriod,
} from "@workspace/api-client-react";
import type { GetLeaderboardParams } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Trophy, Clock, Calendar } from "lucide-react";

const RANK_COLORS = ["#EE7F31", "#C0C0C0", "#CD7F32"];

type Period = "weekly" | "monthly" | "all-time";

export default function Leaderboard() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<Period>("all-time");
  const [limit] = useState(10);

  const params: GetLeaderboardParams = { period: period as typeof GetLeaderboardPeriod[keyof typeof GetLeaderboardPeriod], limit };
  const { data, isLoading } = useGetLeaderboard(params, {
    query: { queryKey: getGetLeaderboardQueryKey(params) },
  });

  const chartData = data?.slice(0, 8).map((entry) => ({
    name: `${entry.firstName} ${entry.lastName[0]}.`,
    hours: entry.totalHoursLogged,
    events: entry.eventsAttended,
  })) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leaderboard</h1>
          <p className="text-muted-foreground">Top volunteers by hours contributed</p>
        </div>
        <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
          <SelectTrigger className="w-36" data-testid="select-leaderboard-period">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all-time">All Time</SelectItem>
            <SelectItem value="monthly">This Month</SelectItem>
            <SelectItem value="weekly">This Week</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-14 rounded-md" />)}
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            {data?.map((entry, idx) => (
              <div
                key={entry.volunteerId}
                className={`flex items-center gap-4 p-4 rounded-lg border hover:shadow-sm transition-shadow ${
                  entry.volunteerId === user?.userId
                    ? "bg-primary/5 border-primary/30 ring-1 ring-primary/20"
                    : "bg-card"
                }`}
                data-testid={`row-leaderboard-${entry.volunteerId}`}
              >
                <div className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm shrink-0 ${
                  idx === 0 ? "bg-amber-100 text-amber-700" :
                  idx === 1 ? "bg-gray-100 text-gray-600" :
                  idx === 2 ? "bg-orange-100 text-orange-700" :
                  "bg-muted text-muted-foreground"
                }`}>
                  {idx < 3 ? <Trophy className="h-4 w-4" /> : entry.rank}
                </div>
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                  {entry.firstName[0]}{entry.lastName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{entry.firstName} {entry.lastName}</div>
                  {entry.badge && (
                    <div className="text-xs text-primary">{entry.badge}</div>
                  )}
                </div>
                <div className="flex items-center gap-4 shrink-0 text-sm">
                  <div className="text-right">
                    <div className="font-bold">{entry.totalHoursLogged}h</div>
                    <div className="text-xs text-muted-foreground">hours</div>
                  </div>
                  <div className="text-right hidden sm:block">
                    <div className="font-bold">{entry.eventsAttended}</div>
                    <div className="text-xs text-muted-foreground">events</div>
                  </div>
                </div>
              </div>
            ))}
            {(!data || data.length === 0) && (
              <div className="text-center py-12 text-muted-foreground">
                No leaderboard data available yet.
              </div>
            )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Hours by Volunteer</CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={60} />
                    <Tooltip
                      formatter={(val: number) => [`${val}h`, "Hours"]}
                      contentStyle={{ fontSize: 12 }}
                    />
                    <Bar dataKey="hours" fill="#EE7F31" radius={[0, 4, 4, 0]}>
                      {chartData.map((_, index) => (
                        <Cell key={index} fill={RANK_COLORS[index] ?? "#EE7F31"} opacity={index < 3 ? 1 : 0.7} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
                  No data yet.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

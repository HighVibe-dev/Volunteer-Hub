import { useState } from "react";
import {
  useGetMyAttendance,
  getGetMyAttendanceQueryKey,
} from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Clock, Calendar, CheckCircle } from "lucide-react";
import { Link } from "wouter";

export default function Attendance() {
  const { user } = useAuth();
  const [page, setPage] = useState(0);

  const params = { page, size: 20 };
  const { data, isLoading } = useGetMyAttendance(params, {
    query: { queryKey: getGetMyAttendanceQueryKey(params) },
  });

  const totalHours = data?.content?.reduce((sum, rec) => sum + (rec.hoursLogged ?? 0), 0) ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Attendance</h1>
        <p className="text-muted-foreground">Your volunteer attendance history</p>
      </div>

      <div className="grid grid-cols-2 gap-4 max-w-md">
        <Card>
          <CardContent className="pt-6 text-center">
            <Clock className="h-6 w-6 text-primary mx-auto mb-2" />
            <div className="text-2xl font-bold">{totalHours.toFixed(1)}</div>
            <div className="text-xs text-muted-foreground">Total Hours</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Calendar className="h-6 w-6 text-primary mx-auto mb-2" />
            <div className="text-2xl font-bold">{data?.totalElements ?? 0}</div>
            <div className="text-xs text-muted-foreground">Sessions</div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-md" />)}
        </div>
      ) : (
        <>
          <div className="rounded-md border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Event</th>
                  <th className="px-4 py-3 text-left font-medium">Check In</th>
                  <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">Check Out</th>
                  <th className="px-4 py-3 text-right font-medium">Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data?.content?.map((rec) => (
                  <tr key={rec.id} className="hover:bg-muted/30" data-testid={`row-attendance-${rec.id}`}>
                    <td className="px-4 py-3">
                      <Link href={`/events/${rec.eventId}`}>
                        <span className="font-medium hover:underline cursor-pointer text-primary">{rec.eventTitle}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(rec.checkIn).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                      {rec.checkOut ? new Date(rec.checkOut).toLocaleTimeString() : (
                        <span className="text-xs text-yellow-600 font-medium">In progress</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {rec.hoursLogged != null ? `${rec.hoursLogged}h` : "—"}
                    </td>
                  </tr>
                ))}
                {(!data?.content || data.content.length === 0) && (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center text-muted-foreground">
                      No attendance records yet. Attend an event to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={data.first} data-testid="btn-attendance-prev">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">{data.number + 1} / {data.totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={data.last} data-testid="btn-attendance-next">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

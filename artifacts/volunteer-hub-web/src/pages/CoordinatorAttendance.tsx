import { useState } from "react";
import {
  useListEvents,
  getListEventsQueryKey,
  useGetEventAttendance,
  getGetEventAttendanceQueryKey,
  useListApplications,
  getListApplicationsQueryKey,
  useCheckInVolunteer,
  useUpdateAttendance,
  ListEventsStatus,
  ListApplicationsStatus,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { CheckCircle, LogIn, LogOut, Calendar, Clock, Users } from "lucide-react";

interface CheckOutDialogState {
  attendanceId: number;
  volunteerName: string;
  checkIn: string;
}

export default function CoordinatorAttendance() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [checkOutDialog, setCheckOutDialog] = useState<CheckOutDialogState | null>(null);
  const [checkOutTime, setCheckOutTime] = useState("");
  const [hoursLogged, setHoursLogged] = useState("");
  const [notes, setNotes] = useState("");

  const { data: upcomingEvents } = useListEvents(
    { status: ListEventsStatus.UPCOMING, size: 20 },
    { query: { queryKey: getListEventsQueryKey({ status: ListEventsStatus.UPCOMING, size: 20 }) } }
  );
  const { data: ongoingEvents } = useListEvents(
    { status: ListEventsStatus.ONGOING, size: 20 },
    { query: { queryKey: getListEventsQueryKey({ status: ListEventsStatus.ONGOING, size: 20 }) } }
  );

  const allEvents = [
    ...(ongoingEvents?.content ?? []),
    ...(upcomingEvents?.content ?? []),
  ];

  const { data: attendance, isLoading: loadingAttendance } = useGetEventAttendance(
    selectedEventId!,
    { query: { enabled: !!selectedEventId, queryKey: getGetEventAttendanceQueryKey(selectedEventId!) } }
  );

  const { data: approvedApps, isLoading: loadingApps } = useListApplications(
    { eventId: selectedEventId!, status: ListApplicationsStatus.APPROVED, size: 50 },
    { query: { enabled: !!selectedEventId, queryKey: getListApplicationsQueryKey({ eventId: selectedEventId!, status: ListApplicationsStatus.APPROVED, size: 50 }) } }
  );

  const checkInMutation = useCheckInVolunteer();
  const updateAttendanceMutation = useUpdateAttendance();

  const checkedInVolunteerIds = new Set((attendance ?? []).map((r) => r.volunteerId));

  const handleCheckIn = (volunteerId: number, name: string) => {
    if (!selectedEventId) return;
    checkInMutation.mutate(
      { eventId: selectedEventId, data: { volunteerId } },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getGetEventAttendanceQueryKey(selectedEventId) });
          toast({ title: `${name} checked in` });
        },
        onError: () => toast({ variant: "destructive", title: "Check-in failed" }),
      }
    );
  };

  const openCheckOut = (rec: { id: number; volunteerName: string; checkIn: string }) => {
    setCheckOutDialog({ attendanceId: rec.id, volunteerName: rec.volunteerName, checkIn: rec.checkIn });
    setCheckOutTime(new Date().toISOString().slice(0, 16));
    setHoursLogged("");
    setNotes("");
  };

  const handleCheckOut = () => {
    if (!checkOutDialog) return;
    updateAttendanceMutation.mutate(
      {
        attendanceId: checkOutDialog.attendanceId,
        data: {
          checkOut: checkOutTime ? new Date(checkOutTime).toISOString() : undefined,
          hoursLogged: hoursLogged ? Number(hoursLogged) : undefined,
          notes: notes || undefined,
        },
      },
      {
        onSuccess: () => {
          if (selectedEventId) {
            qc.invalidateQueries({ queryKey: getGetEventAttendanceQueryKey(selectedEventId) });
          }
          toast({ title: `${checkOutDialog.volunteerName} checked out` });
          setCheckOutDialog(null);
        },
        onError: () => toast({ variant: "destructive", title: "Check-out failed" }),
      }
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Attendance Management</h1>
        <p className="text-muted-foreground">Check in and check out volunteers for events</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            Select Event
          </CardTitle>
        </CardHeader>
        <CardContent>
          {allEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No ongoing or upcoming events found.</p>
          ) : (
            <Select
              value={selectedEventId?.toString() ?? ""}
              onValueChange={(val) => setSelectedEventId(Number(val))}
            >
              <SelectTrigger className="max-w-md" data-testid="select-event-attendance">
                <SelectValue placeholder="Select an event to manage attendance…" />
              </SelectTrigger>
              <SelectContent>
                {ongoingEvents?.content && ongoingEvents.content.length > 0 && (
                  <>
                    <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ongoing</div>
                    {ongoingEvents.content.map((e) => (
                      <SelectItem key={e.id} value={e.id.toString()}>
                        🟢 {e.title}
                      </SelectItem>
                    ))}
                  </>
                )}
                {upcomingEvents?.content && upcomingEvents.content.length > 0 && (
                  <>
                    <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Upcoming</div>
                    {upcomingEvents.content.map((e) => (
                      <SelectItem key={e.id} value={e.id.toString()}>
                        📅 {e.title}
                      </SelectItem>
                    ))}
                  </>
                )}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      {selectedEventId && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <LogIn className="h-4 w-4 text-primary" />
                Check In Volunteers
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingApps ? (
                <Skeleton className="h-24 w-full" />
              ) : approvedApps?.content && approvedApps.content.length > 0 ? (
                <div className="space-y-2">
                  {approvedApps.content.map((app) => {
                    const alreadyCheckedIn = checkedInVolunteerIds.has(app.volunteerId);
                    return (
                      <div
                        key={app.id}
                        className="flex items-center justify-between py-2 px-3 rounded-lg border bg-muted/20"
                        data-testid={`attendance-row-checkin-${app.volunteerId}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                            {(app.volunteerName ?? "?")[0]}
                          </div>
                          <span className="font-medium text-sm">{app.volunteerName ?? "Unknown"}</span>
                        </div>
                        {alreadyCheckedIn ? (
                          <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Checked in
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleCheckIn(app.volunteerId, app.volunteerName ?? "Volunteer")}
                            disabled={checkInMutation.isPending}
                            className="gap-1 h-8"
                            data-testid={`btn-checkin-${app.volunteerId}`}
                          >
                            <LogIn className="h-3 w-3" />
                            Check In
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-4 text-center">No approved volunteers for this event.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <LogOut className="h-4 w-4 text-primary" />
                Attendance Records &amp; Check Out
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loadingAttendance ? (
                <div className="p-4"><Skeleton className="h-24 w-full" /></div>
              ) : attendance && attendance.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium">Volunteer</th>
                        <th className="px-4 py-3 text-left font-medium">Check In</th>
                        <th className="px-4 py-3 text-left font-medium">Check Out</th>
                        <th className="px-4 py-3 text-right font-medium">Hours</th>
                        <th className="px-4 py-3 text-right font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {attendance.map((rec) => (
                        <tr key={rec.id} className="hover:bg-muted/30" data-testid={`attendance-record-${rec.id}`}>
                          <td className="px-4 py-3 font-medium">{rec.volunteerName}</td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {new Date(rec.checkIn).toLocaleString()}
                          </td>
                          <td className="px-4 py-3">
                            {rec.checkOut ? (
                              <span className="text-muted-foreground">{new Date(rec.checkOut).toLocaleTimeString()}</span>
                            ) : (
                              <span className="text-xs text-yellow-600 font-medium px-2 py-0.5 bg-yellow-50 rounded-full">Active</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {rec.hoursLogged != null ? `${rec.hoursLogged}h` : "—"}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {!rec.checkOut && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs gap-1"
                                onClick={() => openCheckOut({ id: rec.id, volunteerName: rec.volunteerName ?? "Volunteer", checkIn: rec.checkIn })}
                                data-testid={`btn-checkout-${rec.id}`}
                              >
                                <LogOut className="h-3 w-3" />
                                Check Out
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  No attendance records yet. Use the check-in panel above.
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <Dialog open={!!checkOutDialog} onOpenChange={(open) => !open && setCheckOutDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Check Out — {checkOutDialog?.volunteerName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="checkout-time">Check Out Time</Label>
              <Input
                id="checkout-time"
                type="datetime-local"
                value={checkOutTime}
                onChange={(e) => setCheckOutTime(e.target.value)}
                className="mt-1"
                data-testid="input-checkout-time"
              />
            </div>
            <div>
              <Label htmlFor="hours-logged">Hours Logged</Label>
              <Input
                id="hours-logged"
                type="number"
                step="0.5"
                min="0"
                placeholder="e.g. 3.5"
                value={hoursLogged}
                onChange={(e) => setHoursLogged(e.target.value)}
                className="mt-1"
                data-testid="input-hours-logged"
              />
            </div>
            <div>
              <Label htmlFor="checkout-notes">Notes (optional)</Label>
              <Input
                id="checkout-notes"
                placeholder="Any notes about the session…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1"
                data-testid="input-checkout-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCheckOutDialog(null)}>Cancel</Button>
            <Button
              onClick={handleCheckOut}
              disabled={updateAttendanceMutation.isPending}
              data-testid="btn-confirm-checkout"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Confirm Check Out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

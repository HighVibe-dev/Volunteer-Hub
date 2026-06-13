import { useRoute, Link } from "wouter";
import {
  useGetEvent,
  getGetEventQueryKey,
  useApplyToEvent,
  useWithdrawApplication,
  useGetEventAttendance,
  getGetEventAttendanceQueryKey,
  useCheckInVolunteer,
  useUpdateAttendance,
  useGenerateEventCertificates,
  useListApplications,
  getListApplicationsQueryKey,
  useUpdateApplicationStatus,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, CalendarDays, MapPin, Users, Clock, Award, Edit } from "lucide-react";

export default function EventDetail() {
  const [, params] = useRoute("/events/:id");
  const eventId = Number(params?.id);
  const { user } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();
  const isStaff = user?.role === "ADMIN" || user?.role === "COORDINATOR";

  const { data: event, isLoading } = useGetEvent(eventId, {
    query: { enabled: !!eventId, queryKey: getGetEventQueryKey(eventId) },
  });

  const { data: attendance } = useGetEventAttendance(eventId, {
    query: { enabled: !!eventId && isStaff, queryKey: getGetEventAttendanceQueryKey(eventId) },
  });

  const { data: applications } = useListApplications(
    { eventId, size: 50 },
    { query: { enabled: !!eventId && isStaff, queryKey: getListApplicationsQueryKey({ eventId, size: 50 }) } }
  );

  const applyMutation = useApplyToEvent();
  const checkInMutation = useCheckInVolunteer();
  const updateStatusMutation = useUpdateApplicationStatus();
  const generateCertsMutation = useGenerateEventCertificates();

  const handleApply = () => {
    applyMutation.mutate({ data: { eventId } }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetEventQueryKey(eventId) });
        toast({ title: "Applied successfully!" });
      },
      onError: () => toast({ variant: "destructive", title: "Could not apply" }),
    });
  };

  const handleCheckIn = (volunteerId: number) => {
    checkInMutation.mutate({ eventId, data: { volunteerId } }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetEventAttendanceQueryKey(eventId) });
        toast({ title: "Checked in successfully" });
      },
      onError: () => toast({ variant: "destructive", title: "Check-in failed" }),
    });
  };

  const handleApplicationStatus = (appId: number, status: "APPROVED" | "REJECTED") => {
    updateStatusMutation.mutate({ applicationId: appId, data: { status } }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListApplicationsQueryKey({ eventId, size: 50 }) });
        toast({ title: `Application ${status.toLowerCase()}` });
      },
      onError: () => toast({ variant: "destructive", title: "Failed to update application" }),
    });
  };

  const handleGenerateCerts = () => {
    generateCertsMutation.mutate({ eventId }, {
      onSuccess: (certs) => {
        toast({ title: `${certs.length} certificate(s) generated` });
      },
      onError: () => toast({ variant: "destructive", title: "Failed to generate certificates" }),
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-60" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-muted-foreground">Event not found.</p>
        <Link href="/events"><Button variant="link">Back to Events</Button></Link>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    UPCOMING: "bg-blue-100 text-blue-800",
    ONGOING: "bg-green-100 text-green-800",
    COMPLETED: "bg-gray-100 text-gray-700",
    CANCELLED: "bg-red-100 text-red-800",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/events">
          <Button variant="ghost" size="icon" data-testid="btn-back-events">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{event.title}</h1>
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColors[event.status] ?? ""}`}>
              {event.status}
            </span>
          </div>
        </div>
        {isStaff && (
          <Link href={`/events/${eventId}/edit`}>
            <Button variant="outline" data-testid="btn-edit-event">
              <Edit className="h-4 w-4 mr-2" /> Edit
            </Button>
          </Link>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground whitespace-pre-wrap">{event.description}</p>
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="flex items-center gap-2 text-sm">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Dates</div>
                    <div className="text-muted-foreground">
                      {new Date(event.startDate).toLocaleDateString()} – {new Date(event.endDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Location</div>
                    <div className="text-muted-foreground">{event.location}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Participants</div>
                    <div className="text-muted-foreground">
                      {event.currentParticipants}{event.maxParticipants ? ` / ${event.maxParticipants}` : " enrolled"}
                    </div>
                  </div>
                </div>
              </div>
              {event.skillRequirements && event.skillRequirements.length > 0 && (
                <div className="mt-4">
                  <div className="text-sm font-medium mb-2">Skills Required</div>
                  <div className="flex flex-wrap gap-2">
                    {event.skillRequirements.map((s) => (
                      <Badge key={s.id} variant="secondary">{s.name}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {isStaff && (
            <Tabs defaultValue="applications">
              <TabsList>
                <TabsTrigger value="applications">Applications ({applications?.totalElements ?? 0})</TabsTrigger>
                <TabsTrigger value="attendance">Attendance ({attendance?.length ?? 0})</TabsTrigger>
              </TabsList>

              <TabsContent value="applications" className="mt-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      {applications?.content?.map((app) => (
                        <div key={app.id} className="flex items-center justify-between py-2 border-b last:border-0" data-testid={`row-application-${app.id}`}>
                          <div>
                            <div className="text-sm font-medium">{app.volunteerName}</div>
                            <div className="text-xs text-muted-foreground">{app.volunteerEmail}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              app.status === "APPROVED" ? "bg-green-100 text-green-800" :
                              app.status === "REJECTED" ? "bg-red-100 text-red-800" :
                              "bg-yellow-100 text-yellow-800"
                            }`}>{app.status}</span>
                            {app.status === "PENDING" && (
                              <>
                                <Button size="sm" variant="outline" className="text-green-600 border-green-200"
                                  onClick={() => handleApplicationStatus(app.id, "APPROVED")}
                                  disabled={updateStatusMutation.isPending}
                                  data-testid={`btn-approve-application-${app.id}`}
                                >Approve</Button>
                                <Button size="sm" variant="outline" className="text-red-500 border-red-200"
                                  onClick={() => handleApplicationStatus(app.id, "REJECTED")}
                                  disabled={updateStatusMutation.isPending}
                                  data-testid={`btn-reject-application-${app.id}`}
                                >Reject</Button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                      {(!applications?.content || applications.content.length === 0) && (
                        <p className="text-sm text-muted-foreground text-center py-4">No applications yet.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="attendance" className="mt-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      {attendance?.map((rec) => (
                        <div key={rec.id} className="flex items-center justify-between py-2 border-b last:border-0" data-testid={`row-attendance-${rec.id}`}>
                          <div>
                            <div className="text-sm font-medium">{rec.volunteerName}</div>
                            <div className="text-xs text-muted-foreground">
                              Checked in: {new Date(rec.checkIn).toLocaleTimeString()}
                              {rec.checkOut && ` · Out: ${new Date(rec.checkOut).toLocaleTimeString()}`}
                            </div>
                          </div>
                          {rec.hoursLogged !== null && rec.hoursLogged !== undefined && (
                            <span className="text-sm font-medium">{rec.hoursLogged}h</span>
                          )}
                        </div>
                      ))}
                      {(!attendance || attendance.length === 0) && (
                        <p className="text-sm text-muted-foreground text-center py-4">No attendance records yet.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>

        <div className="space-y-4">
          {user?.role === "VOLUNTEER" && event.status === "UPCOMING" && (
            <Card>
              <CardContent className="pt-6">
                {event.isApplied ? (
                  <div className="text-center">
                    <Badge className="mb-3">Applied</Badge>
                    <p className="text-sm text-muted-foreground">Your application is under review.</p>
                  </div>
                ) : (
                  <>
                    <Button className="w-full" onClick={handleApply} disabled={applyMutation.isPending} data-testid="btn-apply-event">
                      {applyMutation.isPending ? "Applying..." : "Apply to Event"}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      Your application will be reviewed by a coordinator.
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {isStaff && event.status === "COMPLETED" && (
            <Card>
              <CardContent className="pt-6">
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={handleGenerateCerts}
                  disabled={generateCertsMutation.isPending}
                  data-testid="btn-generate-certs"
                >
                  <Award className="h-4 w-4 mr-2" />
                  {generateCertsMutation.isPending ? "Generating..." : "Generate Certificates"}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

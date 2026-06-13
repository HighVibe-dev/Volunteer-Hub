import { useRoute, Link } from "wouter";
import {
  useGetVolunteerById,
  getGetVolunteerByIdQueryKey,
  useListCertificates,
  getListCertificatesQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, Phone, MapPin, Calendar, Clock, Award } from "lucide-react";

export default function VolunteerDetail() {
  const [, params] = useRoute("/volunteers/:id");
  const volunteerId = Number(params?.id);

  const { data: volunteer, isLoading } = useGetVolunteerById(volunteerId, {
    query: { enabled: !!volunteerId, queryKey: getGetVolunteerByIdQueryKey(volunteerId) },
  });

  const { data: certPage } = useListCertificates(
    { volunteerId, size: 5 },
    { query: { enabled: !!volunteerId, queryKey: getListCertificatesQueryKey({ volunteerId, size: 5 }) } }
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-64 col-span-1" />
          <Skeleton className="h-64 col-span-2" />
        </div>
      </div>
    );
  }

  if (!volunteer) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-muted-foreground">Volunteer not found.</p>
        <Link href="/volunteers">
          <Button variant="link">Back to Volunteers</Button>
        </Link>
      </div>
    );
  }

  const statusColor = volunteer.status === "ACTIVE" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
    : volunteer.status === "INACTIVE" ? "bg-gray-100 text-gray-800"
    : "bg-yellow-100 text-yellow-800";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/volunteers">
          <Button variant="ghost" size="icon" data-testid="btn-back-volunteers">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{volunteer.firstName} {volunteer.lastName}</h1>
          <p className="text-muted-foreground capitalize">{volunteer.role.toLowerCase()}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-3xl">
                {volunteer.firstName[0]}{volunteer.lastName[0]}
              </div>
              <div>
                <h2 className="text-xl font-semibold">{volunteer.firstName} {volunteer.lastName}</h2>
                <span className={`text-xs font-medium px-2 py-1 rounded-full mt-1 inline-block ${statusColor}`}>
                  {volunteer.status}
                </span>
              </div>

              <div className="w-full text-left space-y-3 pt-2">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="truncate">{volunteer.email}</span>
                </div>
                {volunteer.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{volunteer.phone}</span>
                  </div>
                )}
                {volunteer.address && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span>{volunteer.address}</span>
                  </div>
                )}
                {volunteer.joinedAt && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Joined {new Date(volunteer.joinedAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-2 space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div className="text-2xl font-bold">{volunteer.totalHoursLogged ?? 0}</div>
                <div className="text-xs text-muted-foreground">Hours Logged</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div className="text-2xl font-bold">{volunteer.eventsAttended ?? 0}</div>
                <div className="text-xs text-muted-foreground">Events</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Award className="h-5 w-5 text-primary" />
                </div>
                <div className="text-2xl font-bold">{certPage?.totalElements ?? 0}</div>
                <div className="text-xs text-muted-foreground">Certificates</div>
              </CardContent>
            </Card>
          </div>

          {volunteer.bio && (
            <Card>
              <CardHeader><CardTitle className="text-base">Bio</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{volunteer.bio}</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle className="text-base">Skills</CardTitle></CardHeader>
            <CardContent>
              {volunteer.skills && volunteer.skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {volunteer.skills.map((skill) => (
                    <Badge key={skill.id} variant="secondary" data-testid={`badge-skill-${skill.id}`}>
                      {skill.name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No skills added yet.</p>
              )}
            </CardContent>
          </Card>

          {certPage && certPage.content && certPage.content.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Recent Certificates</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {certPage.content.map((cert) => (
                    <div key={cert.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <div className="text-sm font-medium">{cert.eventTitle}</div>
                        <div className="text-xs text-muted-foreground">
                          Issued {new Date(cert.issuedAt).toLocaleDateString()}
                        </div>
                      </div>
                      {cert.downloadUrl && (
                        <a href={cert.downloadUrl} target="_blank" rel="noreferrer">
                          <Button variant="outline" size="sm" data-testid={`btn-download-cert-${cert.id}`}>
                            Download
                          </Button>
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import {
  useListCertificates,
  getListCertificatesQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, Award, Download, ExternalLink } from "lucide-react";

export default function Certificates() {
  const [page, setPage] = useState(0);
  const params = { page, size: 20 };

  const { data, isLoading } = useListCertificates(params, {
    query: { queryKey: getListCertificatesQueryKey(params) },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Certificates</h1>
        <p className="text-muted-foreground">Your earned volunteer certificates</p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-40 rounded-lg" />)}
        </div>
      ) : (
        <>
          {data?.content && data.content.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.content.map((cert) => (
                <Card key={cert.id} className="hover:shadow-md transition-shadow" data-testid={`card-certificate-${cert.id}`}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                        <Award className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm line-clamp-2">{cert.eventTitle}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {cert.volunteerName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Issued {new Date(cert.issuedAt).toLocaleDateString()}
                        </div>
                        {cert.certificateNumber && (
                          <div className="text-xs font-mono text-muted-foreground mt-1">
                            #{cert.certificateNumber}
                          </div>
                        )}
                      </div>
                    </div>
                    {cert.downloadUrl && (
                      <a href={cert.downloadUrl} target="_blank" rel="noreferrer" className="block mt-4">
                        <Button variant="outline" size="sm" className="w-full gap-2" data-testid={`btn-download-cert-${cert.id}`}>
                          <Download className="h-3.5 w-3.5" />
                          Download Certificate
                        </Button>
                      </a>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Award className="h-12 w-12 text-muted-foreground mb-4 opacity-30" />
              <h3 className="text-lg font-medium mb-1">No certificates yet</h3>
              <p className="text-sm text-muted-foreground">
                Complete volunteer events to earn certificates.
              </p>
            </div>
          )}

          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{data.totalElements} certificates</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={data.first} data-testid="btn-certs-prev">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={data.last} data-testid="btn-certs-next">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

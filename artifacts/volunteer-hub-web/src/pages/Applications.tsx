import { useState } from "react";
import {
  useListApplications,
  getListApplicationsQueryKey,
  useUpdateApplicationStatus,
  useWithdrawApplication,
  ListApplicationsStatus,
} from "@workspace/api-client-react";
import type { ListApplicationsParams } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, Link as LinkIcon } from "lucide-react";
import { Link } from "wouter";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  APPROVED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  REJECTED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  WITHDRAWN: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

export default function Applications() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [page, setPage] = useState(0);
  const [status, setStatus] = useState("all");
  const isStaff = user?.role === "ADMIN" || user?.role === "COORDINATOR";

  const params: ListApplicationsParams = {
    page,
    size: 20,
    ...(status && status !== "all" ? { status: status as typeof ListApplicationsStatus[keyof typeof ListApplicationsStatus] } : {}),
  };

  const { data, isLoading } = useListApplications(params, {
    query: { queryKey: getListApplicationsQueryKey(params) },
  });

  const updateStatus = useUpdateApplicationStatus();
  const withdraw = useWithdrawApplication();

  const handleStatusUpdate = (appId: number, newStatus: "APPROVED" | "REJECTED") => {
    updateStatus.mutate({ applicationId: appId, data: { status: newStatus } }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListApplicationsQueryKey(params) });
        toast({ title: `Application ${newStatus.toLowerCase()}` });
      },
      onError: () => toast({ variant: "destructive", title: "Failed to update application" }),
    });
  };

  const handleWithdraw = (appId: number) => {
    if (!confirm("Withdraw this application?")) return;
    withdraw.mutate({ applicationId: appId }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListApplicationsQueryKey(params) });
        toast({ title: "Application withdrawn" });
      },
      onError: () => toast({ variant: "destructive", title: "Failed to withdraw" }),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isStaff ? "Applications" : "My Applications"}
          </h1>
          <p className="text-muted-foreground">
            {isStaff ? "Review and manage volunteer applications" : "Track your event applications"}
          </p>
        </div>
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(0); }}>
          <SelectTrigger className="w-40" data-testid="select-application-status">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
            <SelectItem value="WITHDRAWN">Withdrawn</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 rounded-md" />)}
        </div>
      ) : (
        <>
          <div className="rounded-md border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Event</th>
                  {isStaff && <th className="px-4 py-3 text-left font-medium hidden md:table-cell">Volunteer</th>}
                  <th className="px-4 py-3 text-left font-medium">Applied</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data?.content?.map((app) => (
                  <tr key={app.id} className="hover:bg-muted/30 transition-colors" data-testid={`row-application-${app.id}`}>
                    <td className="px-4 py-3">
                      <Link href={`/events/${app.eventId}`}>
                        <span className="font-medium hover:underline cursor-pointer text-primary">{app.eventTitle}</span>
                      </Link>
                    </td>
                    {isStaff && (
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="font-medium">{app.volunteerName}</div>
                        <div className="text-xs text-muted-foreground">{app.volunteerEmail}</div>
                      </td>
                    )}
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(app.appliedAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLORS[app.status] ?? ""}`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {isStaff && app.status === "PENDING" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 border-green-200 h-7"
                              onClick={() => handleStatusUpdate(app.id, "APPROVED")}
                              disabled={updateStatus.isPending}
                              data-testid={`btn-approve-${app.id}`}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-500 border-red-200 h-7"
                              onClick={() => handleStatusUpdate(app.id, "REJECTED")}
                              disabled={updateStatus.isPending}
                              data-testid={`btn-reject-${app.id}`}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                        {user?.role === "VOLUNTEER" && app.status === "PENDING" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-muted-foreground h-7"
                            onClick={() => handleWithdraw(app.id)}
                            disabled={withdraw.isPending}
                            data-testid={`btn-withdraw-${app.id}`}
                          >
                            Withdraw
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {(!data?.content || data.content.length === 0) && (
                  <tr>
                    <td colSpan={isStaff ? 5 : 4} className="px-4 py-12 text-center text-muted-foreground">
                      No applications found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {data.totalElements} applications
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={data.first} data-testid="btn-apps-prev">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm px-3 py-1.5 border rounded-md">{data.number + 1} / {data.totalPages}</span>
                <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={data.last} data-testid="btn-apps-next">
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

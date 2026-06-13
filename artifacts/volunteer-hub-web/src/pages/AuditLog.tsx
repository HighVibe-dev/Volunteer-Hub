import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, Search, ShieldAlert } from "lucide-react";

interface AuditLogEntry {
  id: number;
  action: string;
  entity: string;
  entityId?: number;
  performedBy?: string;
  details?: string;
  timestamp: string;
}

interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  UPDATE: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  DELETE: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  LOGIN: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  LOGOUT: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
};

export default function AuditLog() {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery<Page<AuditLogEntry>>({
    queryKey: ["audit-logs", page],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Page<AuditLogEntry>>>("/audit", {
        params: { page, size: 50 },
      });
      return res.data.data;
    },
  });

  const filtered = search
    ? (data?.content ?? []).filter(
        (log) =>
          log.action?.toLowerCase().includes(search.toLowerCase()) ||
          log.entity?.toLowerCase().includes(search.toLowerCase()) ||
          log.performedBy?.toLowerCase().includes(search.toLowerCase()) ||
          log.details?.toLowerCase().includes(search.toLowerCase())
      )
    : (data?.content ?? []);

  const totalPages = data?.totalPages ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <ShieldAlert className="h-7 w-7 text-primary" />
          Audit Log
        </h1>
        <p className="text-muted-foreground">System-wide activity trail (admin only)</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <CardTitle className="text-base">Activity Records</CardTitle>
            {data && (
              <Badge variant="secondary">{data.totalElements} entries</Badge>
            )}
            <div className="relative ml-auto w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filter logs…"
                className="pl-9 h-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                data-testid="input-audit-search"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-1 p-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <Skeleton key={i} className="h-12 rounded" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              No audit entries found.
            </div>
          ) : (
            <div className="divide-y">
              {filtered.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-4 px-4 py-3 hover:bg-muted/40 transition-colors"
                  data-testid={`audit-row-${log.id}`}
                >
                  <Badge
                    className={`mt-0.5 shrink-0 text-xs font-semibold ${
                      ACTION_COLORS[log.action] ?? "bg-muted text-muted-foreground"
                    }`}
                    variant="outline"
                  >
                    {log.action}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{log.entity}</span>
                      {log.entityId && (
                        <span className="text-xs text-muted-foreground">
                          #{log.entityId}
                        </span>
                      )}
                      {log.performedBy && (
                        <span className="text-xs text-muted-foreground">
                          by <span className="font-medium text-foreground">{log.performedBy}</span>
                        </span>
                      )}
                    </div>
                    {log.details && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {log.details}
                      </p>
                    )}
                  </div>
                  <time className="text-xs text-muted-foreground shrink-0 mt-0.5">
                    {new Date(log.timestamp).toLocaleString()}
                  </time>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page + 1} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              data-testid="btn-audit-prev"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              data-testid="btn-audit-next"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

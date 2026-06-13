import { useState } from "react";
import { Link } from "wouter";
import {
  useListVolunteers,
  getListVolunteersQueryKey,
  useActivateVolunteer,
  useDeactivateVolunteer,
  ListVolunteersStatus,
} from "@workspace/api-client-react";
import type { ListVolunteersParams } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ChevronLeft, ChevronRight, UserCheck, UserX, Eye } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  INACTIVE: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
};

export default function Volunteers() {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [skill, setSkill] = useState("");
  const [debouncedSkill, setDebouncedSkill] = useState("");
  const [city, setCity] = useState("");
  const [debouncedCity, setDebouncedCity] = useState("");
  const [availability, setAvailability] = useState("");
  const [debouncedAvailability, setDebouncedAvailability] = useState("");
  const qc = useQueryClient();
  const { toast } = useToast();

  const params: ListVolunteersParams & { city?: string; availability?: string } = {
    page,
    size: 20,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(status && status !== "all" ? { status: status as typeof ListVolunteersStatus[keyof typeof ListVolunteersStatus] } : {}),
    ...(debouncedSkill ? { skill: debouncedSkill } : {}),
    ...(debouncedCity ? { city: debouncedCity } : {}),
    ...(debouncedAvailability ? { availability: debouncedAvailability } : {}),
  };

  const { data, isLoading } = useListVolunteers(params, {
    query: { queryKey: getListVolunteersQueryKey(params) },
  });

  const activate = useActivateVolunteer();
  const deactivate = useDeactivateVolunteer();

  const handleSearch = (val: string) => {
    setSearch(val);
    clearTimeout((window as any).__vsearchTimer);
    (window as any).__vsearchTimer = setTimeout(() => {
      setDebouncedSearch(val);
      setPage(0);
    }, 300);
  };

  const handleStatusChange = (val: string) => {
    setStatus(val);
    setPage(0);
  };

  const handleSkillFilter = (val: string) => {
    setSkill(val);
    clearTimeout((window as any).__vskillTimer);
    (window as any).__vskillTimer = setTimeout(() => {
      setDebouncedSkill(val);
      setPage(0);
    }, 300);
  };

  const handleCityFilter = (val: string) => {
    setCity(val);
    clearTimeout((window as any).__vcityTimer);
    (window as any).__vcityTimer = setTimeout(() => {
      setDebouncedCity(val);
      setPage(0);
    }, 300);
  };

  const handleAvailabilityFilter = (val: string) => {
    setAvailability(val);
    clearTimeout((window as any).__vavailTimer);
    (window as any).__vavailTimer = setTimeout(() => {
      setDebouncedAvailability(val);
      setPage(0);
    }, 300);
  };

  const handleActivate = (id: number) => {
    activate.mutate({ volunteerId: id }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListVolunteersQueryKey(params) });
        toast({ title: "Volunteer activated" });
      },
      onError: () => toast({ variant: "destructive", title: "Failed to activate" }),
    });
  };

  const handleDeactivate = (id: number) => {
    deactivate.mutate({ volunteerId: id }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListVolunteersQueryKey(params) });
        toast({ title: "Volunteer deactivated" });
      },
      onError: () => toast({ variant: "destructive", title: "Failed to deactivate" }),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Volunteers</h1>
        <p className="text-muted-foreground">Manage volunteer accounts and status</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            className="pl-9"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            data-testid="input-volunteer-search"
          />
        </div>
        <Input
          placeholder="Filter by skill..."
          className="w-40"
          value={skill}
          onChange={(e) => handleSkillFilter(e.target.value)}
          data-testid="input-volunteer-skill"
        />
        <Input
          placeholder="Filter by city..."
          className="w-36"
          value={city}
          onChange={(e) => handleCityFilter(e.target.value)}
          data-testid="input-volunteer-city"
        />
        <Input
          placeholder="Availability..."
          className="w-36"
          value={availability}
          onChange={(e) => handleAvailabilityFilter(e.target.value)}
          data-testid="input-volunteer-availability"
        />
        <Select value={status} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-40" data-testid="select-volunteer-status">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-md" />
          ))}
        </div>
      ) : (
        <>
          <div className="rounded-md border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Volunteer</th>
                  <th className="px-4 py-3 text-left font-medium hidden md:table-cell">Skills</th>
                  <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">Hours</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data?.content?.map((vol) => (
                  <tr key={vol.id} className="hover:bg-muted/30 transition-colors" data-testid={`row-volunteer-${vol.id}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                          {vol.firstName[0]}{vol.lastName[0]}
                        </div>
                        <div>
                          <div className="font-medium">{vol.firstName} {vol.lastName}</div>
                          <div className="text-xs text-muted-foreground">{vol.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {vol.skills?.slice(0, 2).map((s) => (
                          <span key={s.id} className="text-xs bg-secondary/10 text-secondary-foreground px-2 py-0.5 rounded-full">{s.name}</span>
                        ))}
                        {(vol.skills?.length ?? 0) > 2 && (
                          <span className="text-xs text-muted-foreground">+{(vol.skills?.length ?? 0) - 2}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground">
                      {vol.totalHoursLogged ?? 0}h
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLORS[vol.status] ?? ""}`}>
                        {vol.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/volunteers/${vol.id}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8" data-testid={`btn-view-volunteer-${vol.id}`}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        {vol.status !== "ACTIVE" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-green-600 hover:text-green-700"
                            onClick={() => handleActivate(vol.id)}
                            disabled={activate.isPending}
                            data-testid={`btn-activate-volunteer-${vol.id}`}
                          >
                            <UserCheck className="h-4 w-4" />
                          </Button>
                        )}
                        {vol.status === "ACTIVE" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-600"
                            onClick={() => handleDeactivate(vol.id)}
                            disabled={deactivate.isPending}
                            data-testid={`btn-deactivate-volunteer-${vol.id}`}
                          >
                            <UserX className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {(!data?.content || data.content.length === 0) && (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                      No volunteers found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {(data.number * data.size) + 1}–{Math.min((data.number + 1) * data.size, data.totalElements)} of {data.totalElements}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={data.first} data-testid="btn-volunteers-prev">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm px-3 py-1.5 border rounded-md">{data.number + 1} / {data.totalPages}</span>
                <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={data.last} data-testid="btn-volunteers-next">
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

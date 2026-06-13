import { useRoute, useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState, useEffect } from "react";
import {
  useCreateEvent,
  useUpdateEvent,
  useGetEvent,
  getGetEventQueryKey,
  getListEventsQueryKey,
  useListSkills,
  getListSkillsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Plus, X } from "lucide-react";

const eventSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  location: z.string().min(1, "Location is required"),
  maxParticipants: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
});

interface SkillRequirement {
  skillId: number;
  skillName: string;
  requiredCount: number;
}

export default function EventForm() {
  const [isEditMatch, editParams] = useRoute("/events/:id/edit");
  const [, setLocation] = useLocation();
  const qc = useQueryClient();
  const { toast } = useToast();

  const isEdit = isEditMatch;
  const eventId = Number(editParams?.id);

  const { data: existingEvent, isLoading } = useGetEvent(eventId, {
    query: { enabled: isEdit && !!eventId, queryKey: getGetEventQueryKey(eventId) },
  });

  const { data: allSkills } = useListSkills({
    query: { queryKey: getListSkillsQueryKey() },
  });

  const createMutation = useCreateEvent();
  const updateMutation = useUpdateEvent();

  const [requirements, setRequirements] = useState<SkillRequirement[]>([]);
  const [selectedSkillId, setSelectedSkillId] = useState<string>("");
  const [selectedCount, setSelectedCount] = useState<string>("1");

  useEffect(() => {
    if (existingEvent?.skillRequirements) {
      setRequirements(
        existingEvent.skillRequirements.map((s) => ({
          skillId: s.id,
          skillName: s.name,
          requiredCount: 1,
        }))
      );
    }
  }, [existingEvent]);

  const addRequirement = () => {
    const sid = Number(selectedSkillId);
    if (!sid) return;
    if (requirements.some((r) => r.skillId === sid)) {
      toast({ variant: "destructive", title: "Skill already added" });
      return;
    }
    const skill = allSkills?.find((s) => s.id === sid);
    if (!skill) return;
    setRequirements((prev) => [
      ...prev,
      { skillId: sid, skillName: skill.name, requiredCount: Number(selectedCount) || 1 },
    ]);
    setSelectedSkillId("");
    setSelectedCount("1");
  };

  const removeRequirement = (skillId: number) => {
    setRequirements((prev) => prev.filter((r) => r.skillId !== skillId));
  };

  const saveRequirements = async (id: number) => {
    if (requirements.length === 0) return;
    await api.post(`/events/${id}/requirements`, requirements.map((r) => ({
      skillId: r.skillId,
      requiredCount: r.requiredCount,
    })));
  };

  const form = useForm<z.infer<typeof eventSchema>>({
    resolver: zodResolver(eventSchema),
    values: existingEvent ? {
      title: existingEvent.title,
      description: existingEvent.description,
      startDate: existingEvent.startDate ? new Date(existingEvent.startDate).toISOString().slice(0, 16) : "",
      endDate: existingEvent.endDate ? new Date(existingEvent.endDate).toISOString().slice(0, 16) : "",
      location: existingEvent.location,
      maxParticipants: existingEvent.maxParticipants ? String(existingEvent.maxParticipants) : "",
      imageUrl: existingEvent.imageUrl ?? "",
    } : {
      title: "",
      description: "",
      startDate: "",
      endDate: "",
      location: "",
      maxParticipants: "",
      imageUrl: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof eventSchema>) => {
    const payload = {
      title: values.title,
      description: values.description,
      startDate: new Date(values.startDate).toISOString(),
      endDate: new Date(values.endDate).toISOString(),
      location: values.location,
      ...(values.maxParticipants ? { maxParticipants: Number(values.maxParticipants) } : {}),
      ...(values.imageUrl ? { imageUrl: values.imageUrl } : {}),
    };

    if (isEdit) {
      updateMutation.mutate({ eventId, data: payload }, {
        onSuccess: async (updated) => {
          await saveRequirements(updated.id).catch(() => {});
          qc.invalidateQueries({ queryKey: getGetEventQueryKey(eventId) });
          qc.invalidateQueries({ queryKey: getListEventsQueryKey() });
          toast({ title: "Event updated successfully" });
          setLocation(`/events/${updated.id}`);
        },
        onError: () => toast({ variant: "destructive", title: "Failed to update event" }),
      });
    } else {
      createMutation.mutate({ data: payload }, {
        onSuccess: async (created) => {
          await saveRequirements(created.id).catch(() => {});
          qc.invalidateQueries({ queryKey: getListEventsQueryKey() });
          toast({ title: "Event created successfully" });
          setLocation(`/events/${created.id}`);
        },
        onError: () => toast({ variant: "destructive", title: "Failed to create event" }),
      });
    }
  };

  if (isEdit && isLoading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const isPending = createMutation.isPending || updateMutation.isPending;
  const availableSkills = (allSkills ?? []).filter(
    (s) => !requirements.some((r) => r.skillId === s.id)
  );

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Link href={isEdit ? `/events/${eventId}` : "/events"}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{isEdit ? "Edit Event" : "Create Event"}</h1>
          <p className="text-muted-foreground">{isEdit ? "Update event details" : "Add a new volunteer event"}</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Event Details</CardTitle></CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl><Input {...field} placeholder="Community clean-up drive" data-testid="input-event-title" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl><Textarea {...field} rows={4} placeholder="Describe the event..." data-testid="input-event-description" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="startDate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date & Time</FormLabel>
                    <FormControl><Input type="datetime-local" {...field} data-testid="input-event-start" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="endDate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date & Time</FormLabel>
                    <FormControl><Input type="datetime-local" {...field} data-testid="input-event-end" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="location" render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl><Input {...field} placeholder="123 Main St, Mumbai" data-testid="input-event-location" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="maxParticipants" render={({ field }) => (
                <FormItem>
                  <FormLabel>Max Participants (optional)</FormLabel>
                  <FormControl><Input type="number" min={1} {...field} placeholder="50" data-testid="input-event-max-participants" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="imageUrl" render={({ field }) => (
                <FormItem>
                  <FormLabel>Image URL (optional)</FormLabel>
                  <FormControl><Input {...field} placeholder="https://..." data-testid="input-event-image-url" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="space-y-3 pt-1">
                <FormLabel>Skill Requirements</FormLabel>
                {requirements.length > 0 && (
                  <div className="flex flex-wrap gap-2" data-testid="skill-requirements-list">
                    {requirements.map((req) => (
                      <Badge
                        key={req.skillId}
                        variant="secondary"
                        className="gap-1.5 pr-1 text-sm"
                        data-testid={`skill-req-${req.skillId}`}
                      >
                        {req.skillName}
                        <span className="text-muted-foreground">×{req.requiredCount}</span>
                        <button
                          type="button"
                          className="ml-0.5 rounded-sm hover:bg-muted p-0.5"
                          onClick={() => removeRequirement(req.skillId)}
                          data-testid={`btn-remove-skill-req-${req.skillId}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="flex gap-2 items-end flex-wrap">
                  <div className="flex-1 min-w-[180px]">
                    <Select
                      value={selectedSkillId}
                      onValueChange={setSelectedSkillId}
                    >
                      <SelectTrigger data-testid="select-skill-requirement">
                        <SelectValue placeholder="Select a skill…" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableSkills.map((s) => (
                          <SelectItem key={s.id} value={String(s.id)}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-24">
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      value={selectedCount}
                      onChange={(e) => setSelectedCount(e.target.value)}
                      placeholder="Count"
                      data-testid="input-skill-count"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addRequirement}
                    disabled={!selectedSkillId}
                    className="gap-1"
                    data-testid="btn-add-skill-requirement"
                  >
                    <Plus className="h-4 w-4" />
                    Add
                  </Button>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={isPending} data-testid="btn-submit-event">
                  {isPending ? "Saving..." : isEdit ? "Update Event" : "Create Event"}
                </Button>
                <Link href={isEdit ? `/events/${eventId}` : "/events"}>
                  <Button type="button" variant="outline">Cancel</Button>
                </Link>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

import { useRoute, useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  useCreateEvent,
  useUpdateEvent,
  useGetEvent,
  getGetEventQueryKey,
  getListEventsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";

const eventSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  location: z.string().min(1, "Location is required"),
  maxParticipants: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
});

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

  const createMutation = useCreateEvent();
  const updateMutation = useUpdateEvent();

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

  const onSubmit = (values: z.infer<typeof eventSchema>) => {
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
        onSuccess: (updated) => {
          qc.invalidateQueries({ queryKey: getGetEventQueryKey(eventId) });
          qc.invalidateQueries({ queryKey: getListEventsQueryKey() });
          toast({ title: "Event updated successfully" });
          setLocation(`/events/${updated.id}`);
        },
        onError: () => toast({ variant: "destructive", title: "Failed to update event" }),
      });
    } else {
      createMutation.mutate({ data: payload }, {
        onSuccess: (created) => {
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

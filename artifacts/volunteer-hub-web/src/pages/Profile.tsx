import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  useGetMyProfile,
  getGetMyProfileQueryKey,
  useUpdateMyProfile,
  useListSkills,
  getListSkillsQueryKey,
  useAddVolunteerSkill,
  useRemoveVolunteerSkill,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { X, Plus } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().optional(),
  address: z.string().optional(),
  bio: z.string().optional(),
});

export default function Profile() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [selectedSkillId, setSelectedSkillId] = useState<string>("");

  const { data: profile, isLoading } = useGetMyProfile({
    query: { queryKey: getGetMyProfileQueryKey() },
  });

  const { data: allSkills } = useListSkills({
    query: { queryKey: getListSkillsQueryKey() },
  });

  const updateProfile = useUpdateMyProfile();
  const addSkill = useAddVolunteerSkill();
  const removeSkill = useRemoveVolunteerSkill();

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    values: {
      firstName: profile?.firstName ?? "",
      lastName: profile?.lastName ?? "",
      phone: profile?.phone ?? "",
      address: profile?.address ?? "",
      bio: profile?.bio ?? "",
    },
  });

  const onSubmit = (values: z.infer<typeof profileSchema>) => {
    updateProfile.mutate({ data: values }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetMyProfileQueryKey() });
        toast({ title: "Profile updated successfully" });
      },
      onError: () => toast({ variant: "destructive", title: "Failed to update profile" }),
    });
  };

  const handleAddSkill = () => {
    if (!selectedSkillId || !profile) return;
    addSkill.mutate({ volunteerId: profile.id, data: { skillId: Number(selectedSkillId) } }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetMyProfileQueryKey() });
        setSelectedSkillId("");
        toast({ title: "Skill added" });
      },
      onError: () => toast({ variant: "destructive", title: "Failed to add skill" }),
    });
  };

  const handleRemoveSkill = (skillId: number) => {
    if (!profile) return;
    removeSkill.mutate({ volunteerId: profile.id, skillId }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetMyProfileQueryKey() });
        toast({ title: "Skill removed" });
      },
      onError: () => toast({ variant: "destructive", title: "Failed to remove skill" }),
    });
  };

  const currentSkillIds = new Set(profile?.skills?.map((s) => s.id) ?? []);
  const availableSkills = allSkills?.filter((s) => !currentSkillIds.has(s.id)) ?? [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
        <p className="text-muted-foreground">Update your personal information</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Personal Details</CardTitle></CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="firstName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl><Input {...field} data-testid="input-first-name" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="lastName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl><Input {...field} data-testid="input-last-name" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl><Input {...field} data-testid="input-phone" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="address" render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl><Input {...field} data-testid="input-address" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="bio" render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl><Textarea {...field} rows={3} data-testid="input-bio" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Button type="submit" disabled={updateProfile.isPending} data-testid="btn-save-profile">
                {updateProfile.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>My Skills</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2 min-h-8">
            {profile?.skills?.map((skill) => (
              <Badge key={skill.id} variant="secondary" className="gap-1" data-testid={`badge-skill-${skill.id}`}>
                {skill.name}
                <button
                  onClick={() => handleRemoveSkill(skill.id)}
                  className="ml-1 hover:text-destructive"
                  data-testid={`btn-remove-skill-${skill.id}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {(!profile?.skills || profile.skills.length === 0) && (
              <span className="text-sm text-muted-foreground">No skills added yet.</span>
            )}
          </div>
          <div className="flex gap-2">
            <Select value={selectedSkillId} onValueChange={setSelectedSkillId}>
              <SelectTrigger className="flex-1" data-testid="select-add-skill">
                <SelectValue placeholder="Select a skill to add" />
              </SelectTrigger>
              <SelectContent>
                {availableSkills.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={handleAddSkill}
              disabled={!selectedSkillId || addSkill.isPending}
              data-testid="btn-add-skill"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

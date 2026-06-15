import { useState, useRef } from "react";
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
import { X, Plus, Camera, Clock, Award, CalendarCheck, Zap, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const AVAILABILITY_OPTIONS = ["Weekdays", "Weekends", "Evenings", "Flexible"] as const;

const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
  city: z.string().optional(),
  college: z.string().optional(),
  age: z.coerce.number().int().min(10).max(120).optional().or(z.literal("")),
  bio: z.string().optional(),
});

type BadgeLevel = "NONE" | "BRONZE" | "SILVER" | "GOLD";

const BADGE_CONFIG: Record<BadgeLevel, { label: string; className: string }> = {
  NONE:   { label: "No Badge",  className: "bg-gray-100 text-gray-500 border-gray-200" },
  BRONZE: { label: "Bronze",   className: "bg-amber-100 text-amber-700 border-amber-300" },
  SILVER: { label: "Silver",   className: "bg-slate-100 text-slate-600 border-slate-300" },
  GOLD:   { label: "Gold ✦",   className: "bg-yellow-100 text-yellow-700 border-yellow-300" },
};

function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  return name.trim().split(/\s+/).map((w) => w[0]?.toUpperCase() ?? "").slice(0, 2).join("");
}

function StatTile({ icon: Icon, value, label }: { icon: React.ElementType; value: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1 p-4 rounded-xl bg-muted/50 border border-border/50 flex-1">
      <Icon className="h-5 w-5 text-primary mb-1" />
      <div className="text-2xl font-bold text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground text-center leading-tight">{label}</div>
    </div>
  );
}

export default function Profile() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedSkillId, setSelectedSkillId] = useState<string>("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [availability, setAvailability] = useState<string[]>([]);

  const { data: profile, isLoading } = useGetMyProfile({
    query: {
      queryKey: getGetMyProfileQueryKey(),
      onSuccess: (data: any) => {
        if (data?.availability) {
          setAvailability(data.availability.split(",").map((s: string) => s.trim()).filter(Boolean));
        }
      },
    },
  } as any);

  const { data: allSkills } = useListSkills({
    query: { queryKey: getListSkillsQueryKey() },
  });

  const updateProfile = useUpdateMyProfile();
  const addSkill = useAddVolunteerSkill();
  const removeSkill = useRemoveVolunteerSkill();

  const p = profile as any;

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    values: {
      name: p?.name ?? `${p?.firstName ?? ""} ${p?.lastName ?? ""}`.trim(),
      phone: p?.phone ?? "",
      city: p?.city ?? "",
      college: p?.college ?? "",
      age: p?.age ?? "",
      bio: p?.bio ?? "",
    },
  });

  const onSubmit = (values: z.infer<typeof profileSchema>) => {
    const data: Record<string, unknown> = {
      ...values,
      age: values.age === "" ? undefined : Number(values.age),
      availability: availability.join(","),
    };
    updateProfile.mutate({ data } as any, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetMyProfileQueryKey() });
        toast({ title: "Profile updated" });
      },
      onError: () => toast({ variant: "destructive", title: "Failed to update profile" }),
    });
  };

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const localPreview = URL.createObjectURL(file);
    setAvatarPreview(localPreview);
    setUploadingAvatar(true);

    try {
      const metaRes = await fetch("/api/storage/uploads/request-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("accessToken") ?? ""}`,
        },
        body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }),
      });
      if (!metaRes.ok) throw new Error("Could not get upload URL");
      const { uploadURL, objectPath } = await metaRes.json();

      const uploadRes = await fetch(uploadURL, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!uploadRes.ok) throw new Error("Upload to storage failed");

      const servingUrl = `/api/storage${objectPath}`;
      updateProfile.mutate({ data: { profileImage: servingUrl } } as any, {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getGetMyProfileQueryKey() });
          toast({ title: "Profile photo updated" });
        },
        onError: () => toast({ variant: "destructive", title: "Failed to save photo" }),
      });
    } catch (err) {
      toast({ variant: "destructive", title: "Upload failed", description: (err as Error).message });
      setAvatarPreview(null);
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const toggleAvailability = (option: string) => {
    setAvailability((prev) =>
      prev.includes(option) ? prev.filter((o) => o !== option) : [...prev, option]
    );
  };

  const handleAddSkill = () => {
    if (!selectedSkillId || !p) return;
    addSkill.mutate({ volunteerId: p.id, data: { skillId: Number(selectedSkillId) } }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetMyProfileQueryKey() });
        setSelectedSkillId("");
        toast({ title: "Skill added" });
      },
      onError: () => toast({ variant: "destructive", title: "Failed to add skill" }),
    });
  };

  const handleRemoveSkill = (skillId: number) => {
    if (!p) return;
    removeSkill.mutate({ volunteerId: p.id, skillId }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetMyProfileQueryKey() });
        toast({ title: "Skill removed" });
      },
      onError: () => toast({ variant: "destructive", title: "Failed to remove skill" }),
    });
  };

  const currentSkillIds = new Set(p?.skills?.map((s: any) => s.id) ?? []);
  const availableSkills = allSkills?.filter((s: any) => !currentSkillIds.has(s.id)) ?? [];

  const badgeLevel = ((p?.badgeLevel as BadgeLevel) ?? "NONE") as BadgeLevel;
  const badgeCfg = BADGE_CONFIG[badgeLevel] ?? BADGE_CONFIG.NONE;

  const avatarSrc = avatarPreview ?? p?.profileImage ?? null;
  const displayName = p?.name ?? (p?.firstName ? `${p.firstName} ${p.lastName ?? ""}`.trim() : user?.email ?? "");

  const memberSince = p?.createdAt
    ? new Date(p.createdAt).toLocaleDateString("en-IN", { month: "long", year: "numeric" })
    : p?.joinedAt
    ? new Date(p.joinedAt).toLocaleDateString("en-IN", { month: "long", year: "numeric" })
    : null;

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
        <p className="text-muted-foreground">Manage your personal information and skills</p>
      </div>

      {/* ── Hero Card ─────────────────────────────────────────────────────────── */}
      <Card className="overflow-hidden">
        <div className="h-20 bg-gradient-to-r from-[#1a3a2a] to-[#2d6a4f]" />
        <CardContent className="pt-0 pb-6 px-6">
          <div className="flex items-end gap-4 -mt-10">
            {/* Avatar */}
            <div className="relative group shrink-0">
              <div
                className="w-20 h-20 rounded-full border-4 border-background overflow-hidden cursor-pointer shadow-md"
                onClick={handleAvatarClick}
              >
                {avatarSrc ? (
                  <img src={avatarSrc} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#1a3a2a] text-white text-2xl font-bold">
                    {getInitials(displayName)}
                  </div>
                )}
              </div>
              <button
                onClick={handleAvatarClick}
                disabled={uploadingAvatar}
                className="absolute inset-0 w-20 h-20 rounded-full flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border-4 border-background"
              >
                {uploadingAvatar
                  ? <Loader2 className="h-5 w-5 text-white animate-spin" />
                  : <Camera className="h-5 w-5 text-white" />}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleFileChange}
                data-testid="input-avatar"
              />
            </div>

            {/* Name + meta */}
            <div className="flex-1 min-w-0 pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold truncate">{displayName || "—"}</h2>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${badgeCfg.className}`}>
                  {badgeCfg.label}
                </span>
              </div>
              <p className="text-sm text-muted-foreground truncate">{p?.email ?? user?.email ?? ""}</p>
              {memberSince && (
                <p className="text-xs text-muted-foreground mt-0.5">Member since {memberSince}</p>
              )}
            </div>
          </div>

          {/* Stats row */}
          <div className="flex gap-3 mt-5">
            <StatTile icon={Clock} value={(p?.totalHours ?? p?.totalHoursLogged ?? 0).toFixed(1)} label="Hours Volunteered" />
            <StatTile icon={Award} value={p?.certificatesEarned ?? 0} label="Certificates" />
            <StatTile icon={CalendarCheck} value={p?.eventsParticipated ?? p?.eventsAttended ?? 0} label="Events" />
            <StatTile icon={Zap} value={p?.skills?.length ?? 0} label="Skills" />
          </div>
        </CardContent>
      </Card>

      {/* ── Personal Details ─────────────────────────────────────────────────── */}
      <Card>
        <CardHeader><CardTitle>Personal Details</CardTitle></CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl><Input {...field} data-testid="input-name" placeholder="Your full name" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl><Input {...field} data-testid="input-phone" placeholder="+91 00000 00000" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="age" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Age</FormLabel>
                    <FormControl><Input {...field} type="number" min={10} max={120} data-testid="input-age" placeholder="Age" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="city" render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl><Input {...field} data-testid="input-city" placeholder="City" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="college" render={({ field }) => (
                  <FormItem>
                    <FormLabel>College / Institute</FormLabel>
                    <FormControl><Input {...field} data-testid="input-college" placeholder="Your college" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="bio" render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl><Textarea {...field} rows={3} data-testid="input-bio" placeholder="Tell us a bit about yourself…" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              {/* Availability chip-picker */}
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">Availability</label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABILITY_OPTIONS.map((opt) => {
                    const active = availability.includes(opt);
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => toggleAvailability(opt)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                          active
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background text-muted-foreground border-border hover:border-primary/50"
                        }`}
                        data-testid={`chip-availability-${opt.toLowerCase()}`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>

              <Button type="submit" disabled={updateProfile.isPending} data-testid="btn-save-profile">
                {updateProfile.isPending ? "Saving…" : "Save Changes"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* ── Skills ───────────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader><CardTitle>My Skills</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2 min-h-10">
            {p?.skills?.length > 0
              ? p.skills.map((skill: any) => (
                  <Badge key={skill.id} variant="secondary" className="gap-1 pl-3 pr-2 py-1 text-sm" data-testid={`badge-skill-${skill.id}`}>
                    {skill.name}
                    <button
                      onClick={() => handleRemoveSkill(skill.id)}
                      className="ml-1 rounded-full p-0.5 hover:bg-destructive/20 hover:text-destructive transition-colors"
                      data-testid={`btn-remove-skill-${skill.id}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))
              : (
                <p className="text-sm text-muted-foreground">
                  No skills added yet — add some to stand out to coordinators!
                </p>
              )}
          </div>
          <div className="flex gap-2">
            <Select value={selectedSkillId} onValueChange={setSelectedSkillId}>
              <SelectTrigger className="flex-1" data-testid="select-add-skill">
                <SelectValue placeholder="Select a skill to add" />
              </SelectTrigger>
              <SelectContent>
                {availableSkills.map((s: any) => (
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

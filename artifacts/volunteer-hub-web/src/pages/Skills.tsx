import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  useListSkills,
  getListSkillsQueryKey,
  useCreateSkill,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Wrench, Plus } from "lucide-react";

const skillSchema = z.object({
  name: z.string().min(2, "Skill name must be at least 2 characters"),
  category: z.string().optional(),
  description: z.string().optional(),
});

export default function Skills() {
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: skills, isLoading } = useListSkills({
    query: { queryKey: getListSkillsQueryKey() },
  });

  const createSkill = useCreateSkill();

  const form = useForm<z.infer<typeof skillSchema>>({
    resolver: zodResolver(skillSchema),
    defaultValues: { name: "", category: "", description: "" },
  });

  const onSubmit = (values: z.infer<typeof skillSchema>) => {
    createSkill.mutate({ data: values }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListSkillsQueryKey() });
        form.reset();
        toast({ title: "Skill created" });
      },
      onError: () => toast({ variant: "destructive", title: "Failed to create skill" }),
    });
  };

  const categories = [...new Set(skills?.map((s) => s.category).filter(Boolean) as string[])];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Skills</h1>
        <p className="text-muted-foreground">Manage volunteer skills and categories</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">All Skills ({skills?.length ?? 0})</CardTitle>
              </CardHeader>
              <CardContent>
                {categories.length > 0 ? (
                  <div className="space-y-6">
                    {categories.map((cat) => (
                      <div key={cat}>
                        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{cat}</div>
                        <div className="flex flex-wrap gap-2">
                          {skills?.filter((s) => s.category === cat).map((skill) => (
                            <Badge key={skill.id} variant="secondary" className="text-sm" data-testid={`badge-skill-${skill.id}`}>
                              {skill.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Uncategorized</div>
                      <div className="flex flex-wrap gap-2">
                        {skills?.filter((s) => !s.category).map((skill) => (
                          <Badge key={skill.id} variant="secondary" className="text-sm" data-testid={`badge-skill-${skill.id}`}>
                            {skill.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {skills?.map((skill) => (
                      <Badge key={skill.id} variant="secondary" className="text-sm" data-testid={`badge-skill-${skill.id}`}>
                        {skill.name}
                      </Badge>
                    ))}
                    {(!skills || skills.length === 0) && (
                      <div className="flex flex-col items-center w-full py-8 text-muted-foreground">
                        <Wrench className="h-8 w-8 mb-2 opacity-30" />
                        <p className="text-sm">No skills yet. Add your first skill.</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Add New Skill</CardTitle></CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Skill Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g. First Aid" data-testid="input-skill-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="category" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category (optional)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g. Medical" data-testid="input-skill-category" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (optional)</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={2} placeholder="Brief description..." data-testid="input-skill-description" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" disabled={createSkill.isPending} className="w-full" data-testid="btn-create-skill">
                  <Plus className="h-4 w-4 mr-2" />
                  {createSkill.isPending ? "Creating..." : "Create Skill"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

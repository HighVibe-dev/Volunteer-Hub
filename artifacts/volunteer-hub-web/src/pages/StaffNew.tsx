import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCreateStaff } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";

const staffSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["ADMIN", "COORDINATOR"], { required_error: "Role is required" }),
});

export default function StaffNew() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createStaff = useCreateStaff();

  const form = useForm<z.infer<typeof staffSchema>>({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      role: "COORDINATOR",
    },
  });

  const onSubmit = (values: z.infer<typeof staffSchema>) => {
    createStaff.mutate({ data: values }, {
      onSuccess: () => {
        toast({ title: "Staff account created successfully" });
        setLocation("/volunteers");
      },
      onError: (err: any) => {
        toast({
          variant: "destructive",
          title: "Failed to create staff account",
          description: err?.message ?? "Please try again",
        });
      },
    });
  };

  return (
    <div className="space-y-6 max-w-lg">
      <div className="flex items-center gap-4">
        <Link href="/volunteers">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add Staff</h1>
          <p className="text-muted-foreground">Create a new admin or coordinator account</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Staff Details</CardTitle></CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="firstName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl><Input {...field} data-testid="input-staff-first-name" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="lastName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl><Input {...field} data-testid="input-staff-last-name" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl><Input type="email" {...field} placeholder="staff@nayepankh.org" data-testid="input-staff-email" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="password" render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl><Input type="password" {...field} placeholder="Min. 8 characters" data-testid="input-staff-password" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="role" render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-staff-role">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="COORDINATOR">Coordinator</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={createStaff.isPending} data-testid="btn-submit-staff">
                  {createStaff.isPending ? "Creating..." : "Create Account"}
                </Button>
                <Link href="/volunteers">
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

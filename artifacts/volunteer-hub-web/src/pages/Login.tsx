import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { getRoleDashboardPath } from "@/App";

const formSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export default function Login() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const loginMutation = useLogin();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    loginMutation.mutate(
      { data: values },
      {
        onSuccess: (data) => {
          login(data);
          toast({ title: "Welcome back!", description: "You have successfully logged in." });
          setLocation(getRoleDashboardPath(data.role));
        },
        onError: (error: any) => {
          toast({
            variant: "destructive",
            title: "Login failed",
            description: error?.message ?? "Invalid credentials. Please try again.",
          });
          setIsLoading(false);
        },
      }
    );
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#EE7F31]">
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(135deg, #EE7F31 0%, #d4601a 50%, #a84a15 100%)",
          }}
        />
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "radial-gradient(circle at 20% 20%, white 1px, transparent 1px), radial-gradient(circle at 80% 80%, white 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="relative z-10 flex flex-col items-center justify-center w-full px-12 text-white">
          <div className="bg-white rounded-2xl p-6 shadow-2xl mb-8">
            <img
              src="/nayepankh-logo.png"
              alt="NayePankh Foundation"
              className="w-52 h-52 object-contain"
            />
          </div>
          <h1 className="text-4xl font-bold text-center leading-tight drop-shadow">
            Volunteer Hub
          </h1>
          <p className="mt-4 text-lg text-orange-100 text-center max-w-xs leading-relaxed">
            Empowering communities through dedicated volunteering since NayePankh Foundation
          </p>
          <div className="mt-10 grid grid-cols-3 gap-6 text-center">
            {[
              { label: "Volunteers", value: "500+" },
              { label: "Events", value: "120+" },
              { label: "Hours", value: "10k+" },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-3">
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-xs text-orange-100 mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
          <p className="mt-8 text-xs text-orange-200 tracking-wider uppercase">
            80G · 12A · UP Govt. Registered
          </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-background">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex justify-center mb-8">
            <img src="/nayepankh-logo.png" alt="NayePankh Foundation" className="h-20 w-20 object-contain" />
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-extrabold text-foreground">Welcome back</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Sign in to your NayePankh volunteer account
            </p>
          </div>

          <div className="bg-card rounded-xl border shadow-sm p-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email address</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        {...field}
                        data-testid="input-email"
                        autoComplete="email"
                        className="h-11"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="password" render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Password</FormLabel>
                      <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                        Forgot password?
                      </Link>
                    </div>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                        data-testid="input-password"
                        autoComplete="current-password"
                        className="h-11"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <Button
                  type="submit"
                  className="w-full h-11 text-base font-semibold mt-2"
                  disabled={isLoading}
                  data-testid="btn-login"
                >
                  {isLoading ? "Signing in…" : "Sign in"}
                </Button>
              </form>
            </Form>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/register" className="font-semibold text-primary hover:underline">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

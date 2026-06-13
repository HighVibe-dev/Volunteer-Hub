import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRegister } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { getRoleDashboardPath } from "@/App";
import { AuthHeroPanel } from "@/components/auth/AuthHeroPanel";
import { Mail, Lock, User, Phone, MapPin } from "lucide-react";
import "@/components/auth/auth.css";

const formSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().min(10, "Valid phone number required"),
  address: z.string().optional(),
});

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const registerMutation = useRegister();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      phone: "",
      address: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    const payload = {
      name: `${values.firstName} ${values.lastName}`.trim(),
      email: values.email,
      password: values.password,
      phone: values.phone,
    };
    registerMutation.mutate(
      { data: payload as any },
      {
        onSuccess: (data) => {
          login(data);
          toast({ title: "Welcome to NayePankh!", description: "Your account has been created." });
          setLocation(getRoleDashboardPath(data.role));
        },
        onError: (error: any) => {
          const msg =
            error?.response?.data?.message ||
            error?.message ||
            "Please check your information and try again.";
          toast({
            variant: "destructive",
            title: "Registration failed",
            description: msg,
          });
          setIsLoading(false);
        },
      }
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <AuthHeroPanel />

      <div className="auth-right-panel">
        <div className="auth-right-inner" style={{ maxWidth: "30rem" }}>
          {/* Mobile branded header */}
          <div className="auth-mobile-logo">
            <img src="/nayepankh-logo.png" alt="NayePankh" />
            <div className="auth-mobile-logo-text">
              <strong>NayePankh Foundation</strong>
              <span>Volunteer Hub Platform</span>
            </div>
          </div>

          {/* Heading */}
          <div className="auth-right-heading">
            <h2>Join NayePankh 🌟</h2>
            <p>Register as a volunteer and start making an impact in your community.</p>
          </div>

          <div className="auth-card">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                {/* First / Last name row */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <FormField control={form.control} name="firstName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <div className="auth-input-wrapper">
                          <User className="auth-input-icon" aria-hidden="true" />
                          <Input
                            placeholder="John"
                            {...field}
                            data-testid="input-firstname"
                            className="auth-input-field"
                            aria-label="First name"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="lastName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <div className="auth-input-wrapper">
                          <User className="auth-input-icon" aria-hidden="true" />
                          <Input
                            placeholder="Doe"
                            {...field}
                            data-testid="input-lastname"
                            className="auth-input-field"
                            aria-label="Last name"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email address</FormLabel>
                    <FormControl>
                      <div className="auth-input-wrapper">
                        <Mail className="auth-input-icon" aria-hidden="true" />
                        <Input
                          type="email"
                          placeholder="you@example.com"
                          {...field}
                          data-testid="input-email"
                          autoComplete="email"
                          className="auth-input-field"
                          aria-label="Email address"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="password" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="auth-input-wrapper">
                        <Lock className="auth-input-icon" aria-hidden="true" />
                        <Input
                          type="password"
                          placeholder="Min. 6 characters"
                          {...field}
                          data-testid="input-password"
                          autoComplete="new-password"
                          className="auth-input-field"
                          aria-label="Password"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <div className="auth-input-wrapper">
                        <Phone className="auth-input-icon" aria-hidden="true" />
                        <Input
                          placeholder="+91 9876543210"
                          {...field}
                          data-testid="input-phone"
                          className="auth-input-field"
                          aria-label="Phone number"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="address" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address <span style={{ color: "var(--color-muted-foreground)", fontWeight: 400 }}>(Optional)</span></FormLabel>
                    <FormControl>
                      <div className="auth-input-wrapper">
                        <MapPin className="auth-input-icon" aria-hidden="true" />
                        <Input
                          placeholder="City, State"
                          {...field}
                          data-testid="input-address"
                          className="auth-input-field"
                          aria-label="Address (optional)"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <Button
                  type="submit"
                  className="auth-submit-btn w-full"
                  disabled={isLoading}
                  data-testid="btn-register"
                  style={{ marginTop: "0.375rem" }}
                >
                  {isLoading ? "Creating account…" : "Create Account"}
                </Button>
              </form>
            </Form>

            {/* Mini trust row */}
            <div style={{ marginTop: "1rem", display: "flex", justifyContent: "center", gap: "1.25rem", flexWrap: "wrap" }}>
              {["🔒 Secure", "✅ Verified NGO", "🏛️ Govt. Registered"].map((t) => (
                <span key={t} style={{ fontSize: "0.7rem", color: "var(--color-muted-foreground)", fontWeight: 500 }}>{t}</span>
              ))}
            </div>
          </div>

          <p className="auth-bottom-link">
            Already have an account?{" "}
            <Link href="/login" style={{ fontWeight: 600, color: "#EE7F31", textDecoration: "none" }}
              onMouseOver={(e) => (e.currentTarget.style.textDecoration = "underline")}
              onMouseOut={(e) => (e.currentTarget.style.textDecoration = "none")}
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

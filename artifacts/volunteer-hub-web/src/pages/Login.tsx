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
import { AuthHeroPanel } from "@/components/auth/AuthHeroPanel";
import { Mail, Lock, ShieldCheck, Users, BadgeCheck, Building2 } from "lucide-react";
import "@/components/auth/auth.css";
import volunteerPhoto from "@assets/image_1781511411041.png";

const formSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const TRUST = [
  { icon: ShieldCheck, label: "Verified NGO Platform" },
  { icon: Lock,        label: "Secure Data Protection" },
  { icon: Users,       label: "Trusted by 500+ Volunteers" },
  { icon: Building2,   label: "Government Registered" },
];

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#0A66C2" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );
}

export default function Login() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
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

  const handleSocialLogin = (provider: string) => {
    toast({ title: `${provider} login coming soon`, description: "This feature will be available shortly." });
  };

  return (
    <div className="auth-page-root">
      <AuthHeroPanel />

      <div className="auth-right-panel">
        {/* Mobile full-width photo banner */}
        <div className="auth-mobile-hero" style={{ backgroundImage: `url(${volunteerPhoto})` }}>
          <div className="auth-mobile-hero-overlay" />
          <img src="/nayepankh-logo.png" alt="NayePankh" className="auth-mobile-hero-logo" />
          <div className="auth-mobile-hero-quote">
            <span className="auth-mobile-hero-quote-mark">"</span>
            Volunteering is the ultimate exercise in democracy.
            <span className="auth-mobile-hero-quote-author"> — Priya S.</span>
          </div>
        </div>

        <div className="auth-right-inner">

          {/* Heading */}
          <div className="auth-right-heading">
            <h2>Welcome Back!</h2>
            <div className="auth-right-heading-underline" />
            <p>Sign in to continue your volunteering journey.</p>
          </div>

          <div className="auth-card">
            {/* Social login */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem", marginBottom: "0" }}>
              <button
                type="button"
                className="auth-social-btn"
                onClick={() => handleSocialLogin("Google")}
                aria-label="Continue with Google"
              >
                <GoogleIcon />
                Continue with Google
              </button>
              <button
                type="button"
                className="auth-social-btn"
                onClick={() => handleSocialLogin("LinkedIn")}
                aria-label="Continue with LinkedIn"
              >
                <LinkedInIcon />
                Continue with LinkedIn
              </button>
            </div>

            {/* Divider */}
            <div className="auth-divider">
              <div className="auth-divider-line" />
              <span className="auth-divider-text">or continue with email</span>
              <div className="auth-divider-line" />
            </div>

            {/* Email/Password form */}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
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
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <FormLabel>Password</FormLabel>
                      <Link href="/forgot-password" style={{ fontSize: "0.75rem", color: "#1a3a2a", textDecoration: "none", fontWeight: 500 }}
                        onMouseOver={(e) => (e.currentTarget.style.textDecoration = "underline")}
                        onMouseOut={(e) => (e.currentTarget.style.textDecoration = "none")}
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <FormControl>
                      <div className="auth-input-wrapper">
                        <Lock className="auth-input-icon" aria-hidden="true" />
                        <Input
                          type="password"
                          placeholder="••••••••"
                          {...field}
                          data-testid="input-password"
                          autoComplete="current-password"
                          className="auth-input-field"
                          aria-label="Password"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                {/* Remember me */}
                <label className="auth-remember">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    aria-label="Remember me"
                  />
                  Remember me for 30 days
                </label>

                <Button
                  type="submit"
                  className="auth-submit-btn w-full"
                  disabled={isLoading}
                  data-testid="btn-login"
                >
                  {isLoading ? "Signing in…" : "Sign In"}
                </Button>
              </form>
            </Form>

            {/* Trust indicators */}
            <div className="auth-trust-grid">
              {TRUST.map(({ icon: Icon, label }) => (
                <div key={label} className="auth-trust-item">
                  <Icon className="auth-trust-icon" aria-hidden="true" />
                  {label}
                </div>
              ))}
            </div>
          </div>

          <p className="auth-bottom-link">
            New here?{" "}
            <Link href="/register" style={{ fontWeight: 600, color: "#1a3a2a", textDecoration: "none" }}
              onMouseOver={(e) => (e.currentTarget.style.textDecoration = "underline")}
              onMouseOut={(e) => (e.currentTarget.style.textDecoration = "none")}
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

import { Switch, Route, Router as WouterRouter, Redirect, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useMemo } from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";
import NotFound from "@/pages/not-found";

import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ForgotPassword from "@/pages/ForgotPassword";
import Unauthorized from "@/pages/Unauthorized";

import AdminDashboard from "@/pages/AdminDashboard";
import CoordinatorDashboard from "@/pages/CoordinatorDashboard";
import VolunteerDashboard from "@/pages/VolunteerDashboard";

import Volunteers from "@/pages/Volunteers";
import VolunteerDetail from "@/pages/VolunteerDetail";
import Profile from "@/pages/Profile";
import Events from "@/pages/Events";
import EventForm from "@/pages/EventForm";
import EventDetail from "@/pages/EventDetail";
import Applications from "@/pages/Applications";
import Attendance from "@/pages/Attendance";
import CoordinatorAttendance from "@/pages/CoordinatorAttendance";
import Certificates from "@/pages/Certificates";
import Leaderboard from "@/pages/Leaderboard";
import Reports from "@/pages/Reports";
import Skills from "@/pages/Skills";
import StaffNew from "@/pages/StaffNew";

import type { AuthResponseRole } from "@workspace/api-client-react";

const ADMIN: AuthResponseRole[] = ["ADMIN"];
const STAFF: AuthResponseRole[] = ["ADMIN", "COORDINATOR"];
const ALL_ROLES: AuthResponseRole[] = ["ADMIN", "COORDINATOR", "VOLUNTEER"];

export function getRoleDashboardPath(role?: AuthResponseRole): string {
  if (role === "ADMIN") return "/admin/dashboard";
  if (role === "COORDINATOR") return "/coordinator/dashboard";
  return "/volunteer/dashboard";
}

function RoleDashboardRedirect() {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Redirect to="/login" />;
  return <Redirect to={getRoleDashboardPath(user?.role)} />;
}

function AdminPortalRoutes() {
  return (
    <Layout>
      <Switch>
        <Route path="/dashboard" component={AdminDashboard} />
        <Route path="/volunteers/:id" component={VolunteerDetail} />
        <Route path="/volunteers" component={Volunteers} />
        <Route path="/events/new" component={EventForm} />
        <Route path="/events/:id/edit" component={EventForm} />
        <Route path="/events/:id" component={EventDetail} />
        <Route path="/events" component={Events} />
        <Route path="/applications" component={Applications} />
        <Route path="/leaderboard" component={Leaderboard} />
        <Route path="/reports" component={Reports} />
        <Route path="/skills" component={Skills} />
        <Route path="/staff/new" component={StaffNew} />
        <Route path="/profile" component={Profile} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function CoordinatorPortalRoutes() {
  return (
    <Layout>
      <Switch>
        <Route path="/dashboard" component={CoordinatorDashboard} />
        <Route path="/volunteers/:id" component={VolunteerDetail} />
        <Route path="/volunteers" component={Volunteers} />
        <Route path="/events/new" component={EventForm} />
        <Route path="/events/:id/edit" component={EventForm} />
        <Route path="/events/:id" component={EventDetail} />
        <Route path="/events" component={Events} />
        <Route path="/applications" component={Applications} />
        <Route path="/attendance" component={CoordinatorAttendance} />
        <Route path="/leaderboard" component={Leaderboard} />
        <Route path="/profile" component={Profile} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function VolunteerPortalRoutes() {
  return (
    <Layout>
      <Switch>
        <Route path="/dashboard" component={VolunteerDashboard} />
        <Route path="/events/:id" component={EventDetail} />
        <Route path="/events" component={Events} />
        <Route path="/applications" component={Applications} />
        <Route path="/attendance" component={Attendance} />
        <Route path="/certificates" component={Certificates} />
        <Route path="/leaderboard" component={Leaderboard} />
        <Route path="/profile" component={Profile} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/unauthorized" component={Unauthorized} />

      <Route path="/admin/:rest*">
        <ProtectedRoute
          component={() => (
            <WouterRouter base="/admin">
              <AdminPortalRoutes />
            </WouterRouter>
          )}
          allowedRoles={ADMIN}
        />
      </Route>

      <Route path="/coordinator/:rest*">
        <ProtectedRoute
          component={() => (
            <WouterRouter base="/coordinator">
              <CoordinatorPortalRoutes />
            </WouterRouter>
          )}
          allowedRoles={STAFF}
        />
      </Route>

      <Route path="/volunteer/:rest*">
        <ProtectedRoute
          component={() => (
            <WouterRouter base="/volunteer">
              <VolunteerPortalRoutes />
            </WouterRouter>
          )}
          allowedRoles={ALL_ROLES}
        />
      </Route>

      <Route path="/dashboard">
        <RoleDashboardRedirect />
      </Route>

      <Route path="/">
        <RoleDashboardRedirect />
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function AppProviders() {
  const handleUnauthorized = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: (failureCount, error: any) => {
              if (error?.status === 401 || error?.response?.status === 401) {
                handleUnauthorized();
                return false;
              }
              return failureCount < 1;
            },
            refetchOnWindowFocus: false,
          },
          mutations: {
            onError: (error: any) => {
              if (error?.status === 401 || error?.response?.status === 401) {
                handleUnauthorized();
              }
            },
          },
        },
      }),
    []
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" storageKey="naye-pankh-theme">
        <AppProviders />
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

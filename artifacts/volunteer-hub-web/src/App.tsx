import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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
import Dashboard from "@/pages/Dashboard";
import Unauthorized from "@/pages/Unauthorized";
import Volunteers from "@/pages/Volunteers";
import VolunteerDetail from "@/pages/VolunteerDetail";
import Profile from "@/pages/Profile";
import Events from "@/pages/Events";
import EventForm from "@/pages/EventForm";
import EventDetail from "@/pages/EventDetail";
import Applications from "@/pages/Applications";
import Attendance from "@/pages/Attendance";
import Certificates from "@/pages/Certificates";
import Leaderboard from "@/pages/Leaderboard";
import Reports from "@/pages/Reports";
import Skills from "@/pages/Skills";
import StaffNew from "@/pages/StaffNew";
import { AuthResponseRole } from "@workspace/api-client-react";

const ADMIN: AuthResponseRole[] = ["ADMIN"];
const STAFF: AuthResponseRole[] = ["ADMIN", "COORDINATOR"];
const ALL_ROLES: AuthResponseRole[] = ["ADMIN", "COORDINATOR", "VOLUNTEER"];

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function RootRoute() {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Redirect to="/dashboard" />;
  return <Redirect to="/login" />;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/unauthorized" component={Unauthorized} />

      <Route path="/">
        <RootRoute />
      </Route>

      <Route path="/:rest*">
        <Layout>
          <Switch>
            <Route path="/dashboard">
              <ProtectedRoute component={Dashboard} allowedRoles={ALL_ROLES} />
            </Route>

            <Route path="/volunteers">
              <ProtectedRoute component={Volunteers} allowedRoles={STAFF} />
            </Route>
            <Route path="/volunteers/:id">
              <ProtectedRoute component={VolunteerDetail} allowedRoles={STAFF} />
            </Route>

            <Route path="/profile">
              <ProtectedRoute component={Profile} allowedRoles={ALL_ROLES} />
            </Route>

            <Route path="/events/new">
              <ProtectedRoute component={EventForm} allowedRoles={STAFF} />
            </Route>
            <Route path="/events/:id/edit">
              <ProtectedRoute component={EventForm} allowedRoles={STAFF} />
            </Route>
            <Route path="/events/:id">
              <ProtectedRoute component={EventDetail} allowedRoles={ALL_ROLES} />
            </Route>
            <Route path="/events">
              <ProtectedRoute component={Events} allowedRoles={ALL_ROLES} />
            </Route>

            <Route path="/applications">
              <ProtectedRoute component={Applications} allowedRoles={ALL_ROLES} />
            </Route>

            <Route path="/attendance">
              <ProtectedRoute component={Attendance} allowedRoles={ALL_ROLES} />
            </Route>

            <Route path="/certificates">
              <ProtectedRoute component={Certificates} allowedRoles={ALL_ROLES} />
            </Route>

            <Route path="/leaderboard">
              <ProtectedRoute component={Leaderboard} allowedRoles={ALL_ROLES} />
            </Route>

            <Route path="/reports">
              <ProtectedRoute component={Reports} allowedRoles={STAFF} />
            </Route>

            <Route path="/skills">
              <ProtectedRoute component={Skills} allowedRoles={ADMIN} />
            </Route>

            <Route path="/staff/new">
              <ProtectedRoute component={StaffNew} allowedRoles={ADMIN} />
            </Route>

            <Route component={NotFound} />
          </Switch>
        </Layout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="light" storageKey="naye-pankh-theme">
          <AuthProvider>
            <TooltipProvider>
              <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                <Router />
              </WouterRouter>
              <Toaster />
            </TooltipProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;

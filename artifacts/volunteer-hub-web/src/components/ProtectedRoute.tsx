import React from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { AuthResponseRole } from "@workspace/api-client-react";

interface ProtectedRouteProps {
  component: React.ComponentType<any>;
  allowedRoles?: AuthResponseRole[];
}

export function ProtectedRoute({ component: Component, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuth();
  const [, setLocation] = useLocation();

  React.useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/login");
      return;
    }

    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
      setLocation("/unauthorized");
    }
  }, [isAuthenticated, user, allowedRoles, setLocation]);

  if (!isAuthenticated) return null;
  if (allowedRoles && user && !allowedRoles.includes(user.role)) return null;

  return <Component />;
}

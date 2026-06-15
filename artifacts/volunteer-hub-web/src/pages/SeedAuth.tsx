import { useEffect } from "react";
import { useLocation } from "wouter";

export default function SeedAuth() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const refreshToken = params.get("refresh");
    const user = params.get("user");
    const redirect = params.get("redirect") ?? "/dashboard";

    if (token && user) {
      localStorage.setItem("accessToken", token);
      if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("user", decodeURIComponent(user));
      window.location.href = redirect;
    } else {
      setLocation("/login");
    }
  }, [setLocation]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-muted-foreground">Setting up session…</p>
    </div>
  );
}

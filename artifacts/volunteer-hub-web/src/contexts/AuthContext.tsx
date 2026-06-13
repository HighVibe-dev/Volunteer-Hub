import React, { createContext, useContext, useState } from "react";
import { AuthResponse, AuthResponseRole } from "@workspace/api-client-react";

type User = {
  userId: number;
  email: string;
  role: AuthResponseRole;
  firstName: string;
  lastName: string;
};

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  login: (data: AuthResponse) => void;
  logout: () => void;
};

const VALID_ROLES: AuthResponseRole[] = ["ADMIN", "COORDINATOR", "VOLUNTEER"];

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

function buildUserFromResponse(data: AuthResponse): User {
  const claims = decodeJwtPayload(data.accessToken);
  const claimedRole = (claims?.role ?? claims?.authorities ?? null) as string | null;
  const validatedRole: AuthResponseRole =
    VALID_ROLES.includes(claimedRole as AuthResponseRole)
      ? (claimedRole as AuthResponseRole)
      : data.role;
  return {
    userId: (claims?.userId as number | undefined) ?? data.userId,
    email: (claims?.sub as string | undefined) ?? data.email,
    role: validatedRole,
    firstName: data.firstName,
    lastName: data.lastName,
  };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const token = localStorage.getItem("accessToken");
      const savedUser = localStorage.getItem("user");
      if (token && savedUser) {
        const base = JSON.parse(savedUser) as User;
        const claims = decodeJwtPayload(token);
        if (claims) {
          const exp = claims.exp as number | undefined;
          if (exp && Date.now() / 1000 > exp) {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            localStorage.removeItem("user");
            return null;
          }
          const claimedRole = (claims.role ?? claims.authorities ?? null) as string | null;
          return {
            ...base,
            role: VALID_ROLES.includes(claimedRole as AuthResponseRole)
              ? (claimedRole as AuthResponseRole)
              : base.role,
          };
        }
        return base;
      }
    } catch {
      // Ignore
    }
    return null;
  });

  const login = (data: AuthResponse) => {
    const userData = buildUserFromResponse(data);
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

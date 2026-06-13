import React, { createContext, useContext, useEffect, useState } from "react";
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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem("user");
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignore
    }
    return null;
  });

  const login = (data: AuthResponse) => {
    const userData: User = {
      userId: data.userId,
      email: data.email,
      role: data.role,
      firstName: data.firstName,
      lastName: data.lastName,
    };
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

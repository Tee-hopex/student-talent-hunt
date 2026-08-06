import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { AuthUser } from "@/types";

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (token: string, user: AuthUser) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("sgt_token"));
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ["me", token],
    queryFn: async () => {
      const { data } = await api.get<AuthUser>("/auth/me");
      return data;
    },
    enabled: !!token,
    retry: false,
  });

  useEffect(() => {
    if (!token) queryClient.setQueryData(["me", null], null);
  }, [token, queryClient]);

  function login(newToken: string, newUser: AuthUser) {
    localStorage.setItem("sgt_token", newToken);
    setToken(newToken);
    queryClient.setQueryData(["me", newToken], newUser);
  }

  async function logout() {
    try {
      await api.post("/auth/logout");
    } finally {
      localStorage.removeItem("sgt_token");
      setToken(null);
      queryClient.clear();
    }
  }

  return (
    <AuthContext.Provider value={{ user: user ?? null, isLoading: !!token && isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

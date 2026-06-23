import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AuthContext } from "./auth-context";
import { apiRequest } from "../lib/api";
import type { AuthResponse, AuthUser, MeResponse } from "../types/auth";

const TOKEN_STORAGE_KEY = "gift-ledger-token";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadCurrentUser() {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const data = await apiRequest<MeResponse>("/api/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        setUser(data.user);
      } catch {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    loadCurrentUser();
  }, [token]);

  async function register(
    email: string,
    displayName: string,
    password: string
  ) {
    const data = await apiRequest<AuthResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email,
        displayName,
        password
      })
    });

    localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
    setToken(data.token);
    setUser(data.user);
  }

  async function login(email: string, password: string) {
    const data = await apiRequest<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email,
        password
      })
    });

    localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
    setToken(data.token);
    setUser(data.user);
  }

  function logout() {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken(null);
    setUser(null);
  }

  function updateUser(updates: Partial<AuthUser>) {
    setUser((currentUser) => {
      if (!currentUser) {
        return currentUser;
      }

      return {
        ...currentUser,
        ...updates
      };
    });
  }

  const value = useMemo(
    () => ({
      user,
      token,
      isLoading,
      register,
      login,
      logout,
      updateUser
    }),
    [user, token, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
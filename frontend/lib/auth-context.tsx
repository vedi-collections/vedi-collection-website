"use client";

// React layer for auth. Holds the current user, hydrates session state on load
// (validating the stored access token, refreshing it if expired), and exposes
// login / signup / logout actions. Frontend role checks here are UX only —
// the backend always enforces authorization (per CLAUDE.md).

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import {
  AuthError,
  fetchMe,
  loginRequest,
  refreshRequest,
  signupRequest,
  tokenStore,
  type User
} from "./auth";

type AuthStatus = "loading" | "authenticated" | "anonymous";

type AuthContextValue = {
  user: User | null;
  status: AuthStatus;
  login: (email: string, password: string) => Promise<User>;
  signup: (email: string, password: string) => Promise<User>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  // Hydrate from stored tokens on first mount.
  useEffect(() => {
    let active = true;

    async function hydrate() {
      const access = tokenStore.access;
      const refresh = tokenStore.refresh;

      if (!access && !refresh) {
        if (active) setStatus("anonymous");
        return;
      }

      // Try the access token first.
      if (access) {
        try {
          const me = await fetchMe(access);
          if (active) {
            setUser(me);
            setStatus("authenticated");
          }
          return;
        } catch (error) {
          // Non-401 errors (e.g. server down) shouldn't nuke the session.
          if (error instanceof AuthError && error.status !== 401) {
            if (active) setStatus("anonymous");
            return;
          }
        }
      }

      // Access token missing/expired — try to refresh.
      if (refresh) {
        try {
          const tokens = await refreshRequest(refresh);
          tokenStore.save(tokens);
          const me = await fetchMe(tokens.access_token);
          if (active) {
            setUser(me);
            setStatus("authenticated");
          }
          return;
        } catch {
          // Refresh failed — fall through to clearing the session.
        }
      }

      tokenStore.clear();
      if (active) {
        setUser(null);
        setStatus("anonymous");
      }
    }

    void hydrate();
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await loginRequest(email, password);
    tokenStore.save(result);
    setUser(result.user);
    setStatus("authenticated");
    return result.user;
  }, []);

  const signup = useCallback(async (email: string, password: string) => {
    const result = await signupRequest(email, password);
    tokenStore.save(result);
    setUser(result.user);
    setStatus("authenticated");
    return result.user;
  }, []);

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
    setStatus("anonymous");
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, status, login, signup, logout }),
    [user, status, login, signup, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

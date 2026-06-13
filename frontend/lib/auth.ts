// Auth API client + token storage.
// The backend uses stateless bearer tokens (access + refresh), so we persist
// them in localStorage and attach the access token to protected requests.
// This module is framework-agnostic (no React); the React layer lives in
// lib/auth-context.tsx.

import { API_URL } from "./api";

export type Role = "customer" | "seller";

export type User = {
  id: string;
  email: string;
  role: Role;
};

export type TokenPair = {
  access_token: string;
  refresh_token: string;
  token_type: string;
};

export type AuthResponse = TokenPair & { user: User };

const ACCESS_KEY = "vedi.access_token";
const REFRESH_KEY = "vedi.refresh_token";

/** Thrown for any auth API failure; `message` is safe to show to the user. */
export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}

export const tokenStore = {
  get access(): string | null {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(ACCESS_KEY);
  },
  get refresh(): string | null {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(REFRESH_KEY);
  },
  save(tokens: TokenPair): void {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(ACCESS_KEY, tokens.access_token);
    window.localStorage.setItem(REFRESH_KEY, tokens.refresh_token);
  },
  clear(): void {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(ACCESS_KEY);
    window.localStorage.removeItem(REFRESH_KEY);
  }
};

/** Pull a human-readable message out of a FastAPI error body. */
async function readError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { detail?: unknown };
    if (typeof data.detail === "string") return data.detail;
    if (Array.isArray(data.detail)) {
      const messages = data.detail
        .map((item) => (item && typeof item === "object" && "msg" in item ? String((item as { msg: unknown }).msg) : null))
        .filter(Boolean);
      if (messages.length > 0) return messages.join(", ");
    }
  } catch {
    // fall through to the generic message
  }
  if (response.status >= 500) return "The server is having trouble. Please try again shortly.";
  return "Something went wrong. Please try again.";
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
  } catch {
    throw new AuthError("Cannot reach the server. Check your connection and try again.", 0);
  }
  if (!response.ok) {
    throw new AuthError(await readError(response), response.status);
  }
  return response.json() as Promise<T>;
}

export function signupRequest(email: string, password: string): Promise<AuthResponse> {
  return postJson<AuthResponse>("/auth/signup", { email, password });
}

export function loginRequest(email: string, password: string): Promise<AuthResponse> {
  return postJson<AuthResponse>("/auth/login", { email, password });
}

export function refreshRequest(refreshToken: string): Promise<TokenPair> {
  return postJson<TokenPair>("/auth/refresh", { refresh_token: refreshToken });
}

export async function fetchMe(accessToken: string): Promise<User> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store"
    });
  } catch {
    throw new AuthError("Cannot reach the server.", 0);
  }
  if (!response.ok) {
    throw new AuthError(await readError(response), response.status);
  }
  return response.json() as Promise<User>;
}

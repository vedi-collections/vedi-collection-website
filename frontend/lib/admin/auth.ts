// Client-side admin session. The JWT lives in localStorage and is attached to
// every /admin/* request. These checks are UX only — the backend enforces real
// authorization (require_admin) on every call.

const TOKEN_KEY = "vedi_admin_token";

export type JwtPayload = {
  sub: string;
  role: string;
  is_owner?: boolean;
  exp: number;
  type: string;
};

export function saveToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function decodeToken(token: string): JwtPayload | null {
  try {
    let payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const pad = payload.length % 4;
    if (pad) payload += "=".repeat(4 - pad);
    return JSON.parse(atob(payload)) as JwtPayload;
  } catch {
    return null;
  }
}

/** True when a non-expired admin token is present. */
export function isAdminAuthed(): boolean {
  const token = getToken();
  if (!token) return false;
  const payload = decodeToken(token);
  return !!payload && payload.role === "admin" && payload.exp * 1000 > Date.now();
}

/** The signed-in admin's user id (JWT `sub`), or null. */
export function currentUserId(): string | null {
  const token = getToken();
  if (!token) return null;
  return decodeToken(token)?.sub ?? null;
}

/** True if the signed-in admin is the store owner. UX only — the backend
 *  enforces owner-only team changes (require_owner). Older tokens without the
 *  claim read as false, which self-heals on the next login. */
export function isOwner(): boolean {
  const token = getToken();
  if (!token) return false;
  return decodeToken(token)?.is_owner === true;
}

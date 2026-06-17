"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { buttonClasses } from "@/components/ui/Button";
import { ApiError, login } from "@/lib/admin/api";
import { decodeToken, isAdminAuthed, saveToken } from "@/lib/admin/auth";

const inputClass =
  "mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-text " +
  "outline-none focus:border-primary focus:ring-2 focus:ring-accent/40";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Already signed in? Skip the form.
  useEffect(() => {
    if (isAdminAuthed()) router.replace("/admin");
  }, [router]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const token = await login(email.trim(), password);
      if (decodeToken(token)?.role !== "admin") {
        setError("This account doesn't have admin access.");
        return;
      }
      saveToken(token);
      router.replace("/admin");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-7 shadow-sm">
        <div className="text-center">
          <h1 className="font-serif text-2xl font-semibold text-primary">Vedi Collections</h1>
          <p className="mt-1 text-xs uppercase tracking-[0.22em] text-accent">Admin sign in</p>
        </div>

        <form className="mt-7 space-y-4" onSubmit={onSubmit}>
          <label className="block text-sm font-medium text-heading">
            Email
            <input
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          </label>

          <label className="block text-sm font-medium text-heading">
            Password
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
            />
          </label>

          {error && (
            <p role="alert" className="rounded-lg bg-primary/5 px-3 py-2 text-sm text-primary">
              {error}
            </p>
          )}

          <button type="submit" disabled={busy} className={buttonClasses("primary", "lg", "w-full")}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-muted-soft">
          Staff access only. Customers shop without an account.
        </p>
      </div>
    </main>
  );
}

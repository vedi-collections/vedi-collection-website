"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import { Brand } from "@/components/layout/Brand";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { AuthError, type User } from "@/lib/auth";
import { useAuth } from "@/lib/auth-context";

type Mode = "login" | "signup";

const inputClasses =
  "rounded-lg border border-line bg-surface px-3.5 py-2.5 text-base text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent-pale";

function resolveNextPath(user: User): string {
  if (typeof window !== "undefined") {
    const next = new URLSearchParams(window.location.search).get("next");
    // Only allow internal, absolute paths to avoid open-redirects.
    if (next && next.startsWith("/") && !next.startsWith("//")) {
      return next;
    }
  }
  return user.role === "seller" ? "/dashboard" : "/account";
}

export default function LoginPage() {
  const router = useRouter();
  const { status, user, login, signup } = useAuth();

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Already signed in? Bounce to the right place.
  useEffect(() => {
    if (status === "authenticated" && user) {
      router.replace(resolveNextPath(user));
    }
  }, [status, user, router]);

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setConfirm("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError("Please enter your email and password.");
      return;
    }
    if (mode === "signup") {
      if (password.length < 8) {
        setError("Password must be at least 8 characters.");
        return;
      }
      if (password !== confirm) {
        setError("Passwords do not match.");
        return;
      }
    }

    setSubmitting(true);
    try {
      const account =
        mode === "login"
          ? await login(trimmedEmail, password)
          : await signup(trimmedEmail, password);
      router.replace(resolveNextPath(account));
    } catch (err) {
      if (err instanceof AuthError) {
        setError(err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
      setSubmitting(false);
    }
  }

  const isLogin = mode === "login";

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-7 shadow-xl sm:p-9">
        <Brand align="center" className="mb-7 flex justify-center" />

        <div className="mb-6 grid grid-cols-2 gap-1 rounded-full border border-line bg-surface-alt p-1">
          {(["login", "signup"] as Mode[]).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => switchMode(value)}
              className={cn(
                "rounded-full py-2 text-sm font-semibold transition",
                mode === value ? "bg-primary text-primary-fg shadow-sm" : "text-muted"
              )}
            >
              {value === "login" ? "Sign in" : "Create account"}
            </button>
          ))}
        </div>

        <h1 className="text-center text-xl font-semibold text-heading">
          {isLogin ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mb-6 mt-1 text-center text-sm text-muted">
          {isLogin
            ? "Sign in to track orders and check out faster."
            : "Save your bag and order history with Vedi Collections."}
        </p>

        {error && (
          <div role="alert" className="mb-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-heading">
            Email
            <input
              type="email"
              name="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className={inputClasses}
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-heading">
            Password
            <input
              type="password"
              name="password"
              autoComplete={isLogin ? "current-password" : "new-password"}
              required
              minLength={isLogin ? undefined : 8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={isLogin ? "Your password" : "At least 8 characters"}
              className={inputClasses}
            />
          </label>

          {!isLogin && (
            <label className="flex flex-col gap-1.5 text-sm font-medium text-heading">
              Confirm password
              <input
                type="password"
                name="confirm-password"
                autoComplete="new-password"
                required
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                placeholder="Re-enter your password"
                className={inputClasses}
              />
            </label>
          )}

          <Button type="submit" disabled={submitting} size="lg" className="mt-1 w-full rounded-lg">
            {submitting ? "Please wait…" : isLogin ? "Sign in" : "Create account"}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-muted">
          {isLogin ? "New to Vedi Collections?" : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={() => switchMode(isLogin ? "signup" : "login")}
            className="font-semibold text-primary underline-offset-2 hover:underline"
          >
            {isLogin ? "Create an account" : "Sign in"}
          </button>
        </p>

        <p className="mt-6 border-t border-line pt-5 text-center text-xs text-muted-soft">
          Google sign-in and email OTP are coming soon.
        </p>
      </div>
    </main>
  );
}

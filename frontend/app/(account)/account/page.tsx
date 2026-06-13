"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { Brand } from "@/components/layout/Brand";
import { useAuth } from "@/lib/auth-context";

export default function AccountPage() {
  const router = useRouter();
  const { status, user, logout } = useAuth();

  // Guard: send signed-out visitors to login (with a return path).
  useEffect(() => {
    if (status === "anonymous") {
      router.replace("/login?next=/account");
    }
  }, [status, router]);

  function handleLogout() {
    logout();
    router.replace("/");
  }

  if (status !== "authenticated" || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <p className="text-sm text-muted">Loading your account…</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-7 shadow-xl sm:p-9">
        <Brand align="center" className="mb-7 flex justify-center" />

        <h1 className="text-center text-xl font-semibold text-heading">My account</h1>

        <dl className="mt-6 space-y-3 text-sm">
          <div className="flex items-center justify-between rounded-lg bg-surface-alt px-4 py-3">
            <dt className="text-muted">Email</dt>
            <dd className="font-medium text-ink">{user.email}</dd>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-surface-alt px-4 py-3">
            <dt className="text-muted">Account type</dt>
            <dd className="font-medium capitalize text-ink">{user.role}</dd>
          </div>
        </dl>

        <div className="mt-7 flex flex-col gap-3">
          {user.role === "seller" && (
            <Link
              href="/dashboard"
              className="rounded-lg bg-primary py-3 text-center text-sm font-semibold text-primary-fg transition hover:bg-primary-hover"
            >
              Go to seller dashboard
            </Link>
          )}
          <Link
            href="/"
            className="rounded-lg border border-line bg-surface py-3 text-center text-sm font-semibold text-primary transition hover:bg-surface-alt"
          >
            Continue shopping
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg py-2.5 text-center text-sm font-semibold text-muted-soft transition hover:text-primary"
          >
            Sign out
          </button>
        </div>
      </div>
    </main>
  );
}

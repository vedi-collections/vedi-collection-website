"use client";

import Link from "next/link";

import { UserIcon } from "@/components/ui/icons";
import { useAuth } from "@/lib/auth-context";

/** Header account entry point: circle icon on mobile, labelled pill on desktop.
 *  Links to /account when signed in, otherwise /login. */
export function AccountButton() {
  const { status, user } = useAuth();
  const isAuthed = status === "authenticated" && user !== null;
  const href = isAuthed ? "/account" : "/login";
  const label = isAuthed ? "Account" : "Sign in";

  return (
    <Link
      href={href}
      aria-label={isAuthed ? "Your account" : "Sign in to your account"}
      className="relative inline-flex h-[42px] w-[42px] items-center justify-center rounded-full border border-line bg-surface text-primary min-[900px]:w-auto min-[900px]:gap-2 min-[900px]:px-4"
    >
      <UserIcon className="h-5 w-5" />
      <span className="hidden text-[13px] font-bold min-[900px]:inline">{label}</span>
    </Link>
  );
}

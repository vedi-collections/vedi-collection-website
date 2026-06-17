"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { buttonClasses } from "@/components/ui/Button";
import {
  type AdminUser,
  ApiError,
  createAdmin,
  listAdmins,
  setAdminActive,
} from "@/lib/admin/api";
import { currentUserId, isOwner } from "@/lib/admin/auth";
import { cn } from "@/lib/cn";

const inputClass =
  "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-text outline-none " +
  "focus:border-primary focus:ring-2 focus:ring-accent/40";
const labelClass = "block text-sm font-medium text-heading";

type TeamForm = { name: string; email: string; password: string };
const EMPTY: TeamForm = { name: "", email: "", password: "" };

/** Manage admin accounts (employees). Rendered inside the guarded dashboard. */
export function TeamSection() {
  const router = useRouter();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [selfId, setSelfId] = useState<string | null>(null);
  // Only the store owner can change the team; staff get a read-only view.
  const [owner, setOwner] = useState(false);
  const [form, setForm] = useState<TeamForm>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const fail = useCallback(
    (err: unknown) => {
      if (err instanceof ApiError && err.status === 401) {
        router.replace("/admin/login");
        return;
      }
      setError(err instanceof Error ? err.message : "Something went wrong.");
    },
    [router],
  );

  const reload = useCallback(async () => {
    try {
      setAdmins(await listAdmins());
    } catch (err) {
      fail(err);
    }
  }, [fail]);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setSelfId(currentUserId());
    setOwner(isOwner());
    void reload();
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [reload]);

  async function onAdd(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    if (!form.name.trim() || !form.email.trim()) return setError("Name and email are required.");
    if (form.password.length < 8) return setError("Password must be at least 8 characters.");

    setBusy(true);
    try {
      await createAdmin({ name: form.name.trim(), email: form.email.trim(), password: form.password });
      setNotice(`Admin “${form.email.trim()}” added.`);
      setForm(EMPTY);
      await reload();
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  }

  async function onToggle(admin: AdminUser) {
    setError(null);
    setNotice(null);
    const next = !admin.is_active;
    if (!next && !window.confirm(`Deactivate ${admin.email}? They won't be able to sign in.`)) {
      return;
    }
    try {
      await setAdminActive(admin.id, next);
      setNotice(next ? `${admin.email} reactivated.` : `${admin.email} deactivated.`);
      await reload();
    } catch (err) {
      fail(err);
    }
  }

  return (
    <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
      <h2 className="font-serif text-lg font-semibold text-heading">
        Team <span className="text-sm font-normal text-muted">({admins.length})</span>
      </h2>
      <p className="mt-1 text-sm text-muted">
        Admins who can sign in and manage the store.
        {!owner && " Only the store owner can add or deactivate admins."}
      </p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-muted-soft">
            <tr className="border-b border-line">
              <th className="py-2 pr-3">Name</th>
              <th className="py-2 pr-3">Email</th>
              <th className="py-2 pr-3">Status</th>
              <th className="py-2 pr-3" />
            </tr>
          </thead>
          <tbody>
            {admins.map((a) => (
              <tr key={a.id} className={cn("border-b border-line/60", !a.is_active && "opacity-55")}>
                <td className="py-2.5 pr-3 font-medium text-heading">
                  {a.name}
                  {a.id === selfId && <span className="ml-2 text-xs text-accent">you</span>}
                </td>
                <td className="py-2.5 pr-3">{a.email}</td>
                <td className="py-2.5 pr-3">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-semibold",
                      a.is_active ? "bg-whatsapp/10 text-whatsapp-dark" : "bg-primary/10 text-primary",
                    )}
                  >
                    {a.is_active ? "active" : "deactivated"}
                  </span>
                </td>
                <td className="py-2.5 pr-3 text-right">
                  {owner && a.id !== selfId ? (
                    <button
                      type="button"
                      onClick={() => onToggle(a)}
                      className="text-sm font-semibold text-muted hover:text-primary"
                    >
                      {a.is_active ? "Deactivate" : "Reactivate"}
                    </button>
                  ) : (
                    <span className="text-xs text-muted-soft">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add admin — owner only (backend also enforces this via require_owner) */}
      {owner && (
      <form className="mt-5 grid gap-3 border-t border-line pt-5 sm:grid-cols-3" onSubmit={onAdd}>
        <label className={labelClass}>
          Name
          <input className={cn(inputClass, "mt-1")} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        </label>
        <label className={labelClass}>
          Email
          <input type="email" className={cn(inputClass, "mt-1")} value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
        </label>
        <label className={labelClass}>
          Initial password
          <input type="text" className={cn(inputClass, "mt-1")} value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} placeholder="min 8 chars" />
        </label>

        {error && (
          <p role="alert" className="rounded-lg bg-primary/5 px-3 py-2 text-sm text-primary sm:col-span-3">
            {error}
          </p>
        )}
        {notice && !error && (
          <p className="rounded-lg bg-whatsapp/10 px-3 py-2 text-sm text-whatsapp-dark sm:col-span-3">{notice}</p>
        )}

        <div className="sm:col-span-3">
          <button type="submit" disabled={busy} className={buttonClasses("primary", "md")}>
            {busy ? "Adding…" : "Add admin"}
          </button>
        </div>
      </form>
      )}
    </section>
  );
}

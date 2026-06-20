"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { MediaUploader } from "@/components/admin/MediaUploader";
import { TeamSection } from "@/components/admin/TeamSection";
import { buttonClasses } from "@/components/ui/Button";
import { BagIcon, ClockIcon, UsersIcon } from "@/components/ui/icons";
import {
  ApiError,
  type AdminProduct,
  type ChangeLogEntry,
  type ProductAudience,
  type ProductInput,
  type ProductStatus,
  createProduct,
  deleteProduct,
  formatRupees,
  listChangeLog,
  listProducts,
  updateProduct,
} from "@/lib/admin/api";
import { clearToken, isAdminAuthed } from "@/lib/admin/auth";
import { cn } from "@/lib/cn";

const STATUSES: ProductStatus[] = ["draft", "scheduled", "live", "inactive"];

const AUDIENCES: { value: ProductAudience; label: string }[] = [
  { value: "women", label: "Women" },
  { value: "men", label: "Men" },
];

type View = "products" | "activity" | "team";

const NAV: { id: View; label: string; icon: (p: { className?: string }) => React.ReactElement }[] = [
  { id: "products", label: "Products", icon: BagIcon },
  { id: "activity", label: "Activity", icon: ClockIcon },
  { id: "team", label: "Team", icon: UsersIcon },
];

const STATUS_STYLE: Record<ProductStatus, string> = {
  live: "bg-whatsapp/10 text-whatsapp-dark",
  scheduled: "bg-accent/15 text-accent",
  draft: "bg-surface-alt text-muted",
  inactive: "bg-primary/10 text-primary",
};

const inputClass =
  "w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 text-base text-text outline-none " +
  "focus:border-primary focus:ring-2 focus:ring-accent/40";
const labelClass = "block text-base font-medium text-heading";

type FormState = {
  name: string;
  /** Sale price the customer pays (whole rupees). */
  price: string;
  /** Original price / MRP (whole rupees); blank = no discount. */
  mrp: string;
  /** Discount percent — only used to compute `price` in "discount" mode. */
  discount: string;
  /** How the staff enters the price: type both prices, or MRP + a discount %. */
  priceMode: "both" | "discount";
  stock: string;
  status: ProductStatus;
  audience: ProductAudience;
  subcategory: string;
  description: string;
  goLiveAt: string;
  images: string[];
};

const EMPTY: FormState = {
  name: "",
  price: "",
  mrp: "",
  discount: "",
  priceMode: "both",
  stock: "0",
  status: "draft",
  audience: "women",
  subcategory: "",
  description: "",
  goLiveAt: "",
  images: [],
};

export default function AdminDashboard() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [log, setLog] = useState<ChangeLogEntry[]>([]);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState<View>("products");

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
      const [p, l] = await Promise.all([listProducts(), listChangeLog()]);
      setProducts(p);
      setLog(l);
    } catch (err) {
      fail(err);
    }
  }, [fail]);

  useEffect(() => {
    if (!isAdminAuthed()) {
      router.replace("/admin/login");
      return;
    }
    /* Client-only mount gate: the JWT is read from localStorage post-mount (so
       there's no hydration mismatch) and the initial admin data is fetched. The
       react-hooks rule doesn't model on-mount loads; the backend still enforces
       authorization on every request. */
    /* eslint-disable react-hooks/set-state-in-effect */
    setReady(true);
    void reload();
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [router, reload]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function signOut() {
    clearToken();
    router.replace("/admin/login");
  }

  function startEdit(p: AdminProduct) {
    setView("products");
    setEditingId(p.id);
    setForm({
      name: p.name,
      price: String(p.price),
      mrp: p.mrp != null ? String(p.mrp) : "",
      // Pre-fill the % too, so switching to "Set a discount %" on an existing
      // product starts from its current discount instead of blank.
      discount:
        p.mrp != null && p.mrp > p.price
          ? String(Math.round(((p.mrp - p.price) / p.mrp) * 100))
          : "",
      priceMode: "both",
      stock: String(p.stock_quantity),
      status: p.status,
      audience: p.audience,
      subcategory: p.subcategory ?? "",
      description: p.description ?? "",
      goLiveAt: p.go_live_at ? p.go_live_at.slice(0, 16) : "",
      images: p.images ?? [],
    });
    setError(null);
    setNotice(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY);
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setNotice(null);

    const stock = Number(form.stock);
    if (!form.name.trim()) return setError("Name is required.");

    // Resolve the sale price + original price (MRP) from the chosen entry mode:
    //  - "both":     staff types MRP + sale price; the discount % is derived.
    //  - "discount": staff types MRP + discount %; the sale price is computed.
    // Either way we only ever store `price` (sale) and `mrp` (original).
    let price: number;
    let mrp: number | null = null;
    if (form.priceMode === "discount") {
      const original = Number(form.mrp);
      const pct = Number(form.discount);
      if (!form.mrp.trim() || !Number.isInteger(original) || original <= 0)
        return setError("Enter the original price (a whole number of rupees).");
      if (!form.discount.trim() || !Number.isInteger(pct) || pct < 0 || pct > 100)
        return setError("Discount must be a whole number between 0 and 100.");
      mrp = original;
      price = Math.round(original * (1 - pct / 100));
    } else {
      price = Number(form.price);
      if (!form.price.trim() || !Number.isInteger(price) || price < 0)
        return setError("Sale price must be a whole number of rupees.");
      if (form.mrp.trim()) {
        const original = Number(form.mrp);
        if (!Number.isInteger(original) || original < 0)
          return setError("Original price must be a whole number of rupees.");
        if (original < price)
          return setError("Original price should be higher than the sale price.");
        mrp = original > price ? original : null; // equal prices = no real discount
      }
    }

    if (!Number.isInteger(stock) || stock < 0) return setError("Stock must be a whole number.");
    if (form.status === "scheduled" && !form.goLiveAt)
      return setError("Pick a go-live date & time for a scheduled product.");

    const body: ProductInput = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      price,
      mrp,
      stock_quantity: stock,
      images: form.images,
      audience: form.audience,
      subcategory: form.subcategory.trim() || null,
      status: form.status,
      go_live_at: form.status === "scheduled" ? form.goLiveAt : null,
    };

    setSaving(true);
    try {
      if (editingId) {
        await updateProduct(editingId, body);
        setNotice("Product updated.");
      } else {
        await createProduct(body);
        setNotice("Product created.");
      }
      cancelEdit();
      await reload();
    } catch (err) {
      fail(err);
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(p: AdminProduct) {
    if (!window.confirm(`Remove “${p.name}” from the storefront? This is a soft delete.`)) return;
    setError(null);
    setNotice(null);
    try {
      await deleteProduct(p.id);
      setNotice("Product removed (soft delete).");
      await reload();
    } catch (err) {
      fail(err);
    }
  }

  if (!ready) {
    return <main className="grid min-h-screen place-items-center text-base text-muted">Loading…</main>;
  }

  const nameById = new Map(products.map((p) => [p.id, p.name]));
  // Existing sub-categories under the chosen top category, for the combobox.
  // `all` products' sub-categories apply everywhere, so they're always offered.
  const subcategorySuggestions = Array.from(
    new Set(
      products
        .filter((p) => p.audience === form.audience)
        .map((p) => p.subcategory?.trim())
        .filter((s): s is string => Boolean(s)),
    ),
  ).sort((a, b) => a.localeCompare(b));
  const counts: Partial<Record<View, number>> = {
    products: products.length,
    activity: log.length,
  };
  const activeLabel = NAV.find((n) => n.id === view)?.label ?? "";

  // Live pricing preview for the product form's two entry modes.
  const mrpNum = Number(form.mrp);
  const saleNum = Number(form.price);
  const discNum = Number(form.discount);
  const hasMrp = form.mrp.trim() !== "" && Number.isFinite(mrpNum) && mrpNum > 0;
  // "both" mode: derive the discount % from MRP vs the typed sale price.
  const bothPct =
    hasMrp && Number.isFinite(saleNum) && mrpNum > saleNum && saleNum >= 0
      ? Math.round(((mrpNum - saleNum) / mrpNum) * 100)
      : null;
  // "discount" mode: derive the sale price from MRP and the typed discount %.
  const computedSale = hasMrp
    ? Math.max(0, Math.round(mrpNum * (1 - (Number.isFinite(discNum) ? discNum : 0) / 100)))
    : null;

  return (
    <div className="min-h-screen bg-bg text-text">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col lg:flex-row">
        {/* ---- Left sidebar ---- */}
        <aside className="shrink-0 border-b border-line bg-surface lg:sticky lg:top-0 lg:h-screen lg:w-60 lg:border-b-0 lg:border-r">
          <div className="flex h-full flex-col px-4 py-5 lg:px-5 lg:py-6">
            <div className="px-1">
              <h1 className="font-serif text-2xl font-semibold text-primary">Vedi Collections</h1>
              <p className="text-sm uppercase tracking-[0.2em] text-accent">Admin</p>
            </div>

            <nav className="mt-5 flex gap-1 overflow-x-auto lg:mt-8 lg:flex-col lg:overflow-visible">
              {NAV.map((item) => {
                const active = view === item.id;
                const count = counts[item.id];
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setView(item.id)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 whitespace-nowrap rounded-lg px-3 py-2.5 text-base font-medium transition",
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-muted hover:bg-surface-alt hover:text-primary",
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                    {count !== undefined && (
                      <span
                        className={cn(
                          "ml-auto hidden text-sm lg:inline",
                          active ? "text-primary/70" : "text-muted-soft",
                        )}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            <button
              type="button"
              onClick={signOut}
              className={cn(buttonClasses("outline", "sm"), "mt-5 w-full !text-sm lg:mt-auto")}
            >
              Sign out
            </button>
          </div>
        </aside>

        {/* ---- Main content ---- */}
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <h2 className="mb-5 font-serif text-3xl font-semibold text-heading">{activeLabel}</h2>

          {view === "products" && (
            <div className="space-y-6">
              {/* ---- Create / edit form ---- */}
              <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
                <h2 className="font-serif text-xl font-semibold text-heading">
                  {editingId ? "Edit product" : "New product"}
                </h2>

                <form className="mt-4 grid gap-4 sm:grid-cols-2" onSubmit={onSubmit}>
                  <label className={cn(labelClass, "sm:col-span-2")}>
                    Name
                    <input className={cn(inputClass, "mt-1")} value={form.name} onChange={(e) => set("name", e.target.value)} />
                  </label>

                  <div className={cn(labelClass, "sm:col-span-2")}>
                    Pricing
                    {/* Two ways to set the price — both store an original (MRP) + a sale price. */}
                    <div className="mt-1.5 inline-flex rounded-lg border border-line bg-surface-alt p-1 text-sm font-semibold">
                      <button
                        type="button"
                        onClick={() => set("priceMode", "both")}
                        className={cn(
                          "rounded-md px-3.5 py-1.5 transition",
                          form.priceMode === "both" ? "bg-primary text-primary-fg" : "text-muted",
                        )}
                      >
                        Enter both prices
                      </button>
                      <button
                        type="button"
                        onClick={() => set("priceMode", "discount")}
                        className={cn(
                          "rounded-md px-3.5 py-1.5 transition",
                          form.priceMode === "discount" ? "bg-primary text-primary-fg" : "text-muted",
                        )}
                      >
                        Set a discount %
                      </button>
                    </div>

                    <div className="mt-3 grid gap-4 sm:grid-cols-2">
                      <label className={labelClass}>
                        Original price (₹, MRP)
                        <input
                          className={cn(inputClass, "mt-1")}
                          inputMode="numeric"
                          value={form.mrp}
                          onChange={(e) => set("mrp", e.target.value)}
                          placeholder="2000"
                        />
                      </label>

                      {form.priceMode === "discount" ? (
                        <label className={labelClass}>
                          Discount (%)
                          <input
                            className={cn(inputClass, "mt-1")}
                            inputMode="numeric"
                            value={form.discount}
                            onChange={(e) => set("discount", e.target.value)}
                            placeholder="25"
                          />
                        </label>
                      ) : (
                        <label className={labelClass}>
                          Sale price{" "}
                          <span className="font-normal text-muted-soft">(what they pay)</span>
                          <input
                            className={cn(inputClass, "mt-1")}
                            inputMode="numeric"
                            value={form.price}
                            onChange={(e) => set("price", e.target.value)}
                            placeholder="1500"
                          />
                        </label>
                      )}
                    </div>

                    {/* Plain-words preview of the value we calculate for them. */}
                    <p className="mt-2 text-sm font-normal text-muted">
                      {form.priceMode === "discount"
                        ? computedSale != null
                          ? `Sale price: ${formatRupees(computedSale)} — after ${form.discount || 0}% off`
                          : "Enter the original price and a discount to see the sale price."
                        : bothPct != null
                          ? `Discount: ${bothPct}% off · They save ${formatRupees(mrpNum - saleNum)}`
                          : "Tip: add an original price higher than the sale price to show a discount."}
                    </p>
                  </div>

                  <label className={labelClass}>
                    Stock quantity
                    <input className={cn(inputClass, "mt-1")} inputMode="numeric" value={form.stock} onChange={(e) => set("stock", e.target.value)} />
                  </label>

                  <label className={labelClass}>
                    Status
                    <select className={cn(inputClass, "mt-1")} value={form.status} onChange={(e) => set("status", e.target.value as ProductStatus)}>
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </label>

                  {form.status === "scheduled" && (
                    <label className={labelClass}>
                      Go live at
                      <input type="datetime-local" className={cn(inputClass, "mt-1")} value={form.goLiveAt} onChange={(e) => set("goLiveAt", e.target.value)} />
                    </label>
                  )}

                  <label className={cn(labelClass, "sm:col-start-1")}>
                    Category
                    <select
                      className={cn(inputClass, "mt-1")}
                      value={form.audience}
                      onChange={(e) => set("audience", e.target.value as ProductAudience)}
                    >
                      {AUDIENCES.map((a) => (
                        <option key={a.value} value={a.value}>
                          {a.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className={labelClass}>
                    Sub-category{" "}
                    <span className="font-normal text-muted-soft">(pick or type a new one)</span>
                    <input
                      className={cn(inputClass, "mt-1")}
                      list="vedi-subcategories"
                      value={form.subcategory}
                      onChange={(e) => set("subcategory", e.target.value)}
                      placeholder="e.g. Suits, Safari Cloth"
                    />
                    <datalist id="vedi-subcategories">
                      {subcategorySuggestions.map((s) => (
                        <option key={s} value={s} />
                      ))}
                    </datalist>
                  </label>

                  <label className={cn(labelClass, "sm:col-span-2")}>
                    Description
                    <textarea className={cn(inputClass, "mt-1 min-h-[72px]")} value={form.description} onChange={(e) => set("description", e.target.value)} />
                  </label>

                  <div className={cn(labelClass, "sm:col-span-2")}>
                    Images & videos{" "}
                    <span className="font-normal text-muted-soft">(first is the cover)</span>
                    <MediaUploader
                      value={form.images}
                      onChange={(images) => set("images", images)}
                      disabled={saving}
                    />
                  </div>

                  {error && (
                    <p role="alert" className="rounded-lg bg-primary/5 px-3 py-2 text-base text-primary sm:col-span-2">
                      {error}
                    </p>
                  )}
                  {notice && !error && (
                    <p className="rounded-lg bg-whatsapp/10 px-3 py-2 text-base text-whatsapp-dark sm:col-span-2">{notice}</p>
                  )}

                  <div className="flex gap-3 sm:col-span-2">
                    <button type="submit" disabled={saving} className={buttonClasses("primary", "md", "!font-bold !text-base")}>
                      {saving ? "Saving…" : editingId ? "Save changes" : "Create product"}
                    </button>
                    {editingId && (
                      <button type="button" onClick={cancelEdit} className={buttonClasses("ghost", "md", "!text-base")}>
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </section>

              {/* ---- Product list ---- */}
              <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
                <h2 className="font-serif text-xl font-semibold text-heading">
                  Products <span className="text-base font-normal text-muted">({products.length})</span>
                </h2>

                {products.length === 0 ? (
                  <p className="mt-4 text-base text-muted">No products yet. Create your first one above.</p>
                ) : (
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-left text-base">
                      <thead className="text-sm uppercase tracking-wide text-muted-soft">
                        <tr className="border-b border-line">
                          <th className="py-2 pr-3">Name</th>
                          <th className="py-2 pr-3">Category</th>
                          <th className="py-2 pr-3">Price</th>
                          <th className="py-2 pr-3">Stock</th>
                          <th className="py-2 pr-3">Status</th>
                          <th className="py-2 pr-3" />
                        </tr>
                      </thead>
                      <tbody>
                        {products.map((p) => (
                          <tr key={p.id} className={cn("border-b border-line/60", !p.is_active && "opacity-55")}>
                            <td className="py-2.5 pr-3 font-medium text-heading">
                              {p.name}
                              {!p.is_active && <span className="ml-2 text-sm text-primary">deleted</span>}
                            </td>
                            <td className="py-2.5 pr-3 text-muted">
                              {AUDIENCES.find((a) => a.value === p.audience)?.label ?? p.audience}
                              {p.subcategory ? ` · ${p.subcategory}` : ""}
                            </td>
                            <td className="py-2.5 pr-3">
                              <span className="font-medium text-heading">{formatRupees(p.price)}</span>
                              {p.mrp != null && p.mrp > p.price && (
                                <span className="ml-2 text-sm text-muted-soft line-through">
                                  {formatRupees(p.mrp)}
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 pr-3">{p.stock_quantity}</td>
                            <td className="py-2.5 pr-3">
                              <span className={cn("rounded-full px-2.5 py-0.5 text-sm font-semibold", STATUS_STYLE[p.status])}>
                                {p.status}
                              </span>
                            </td>
                            <td className="py-2.5 pr-3 text-right">
                              <button type="button" onClick={() => startEdit(p)} className="text-base font-semibold text-primary hover:underline">
                                Edit
                              </button>
                              {p.is_active && (
                                <button type="button" onClick={() => onDelete(p)} className="ml-4 text-base font-semibold text-muted hover:text-primary">
                                  Delete
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </div>
          )}

          {view === "activity" && (
            <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
              <h2 className="font-serif text-xl font-semibold text-heading">Recent changes</h2>
              {log.length === 0 ? (
                <p className="mt-4 text-base text-muted">No changes recorded yet.</p>
              ) : (
                <ul className="mt-4 space-y-2 text-base">
                  {log.slice(0, 15).map((e) => (
                    <li key={e.id} className="flex flex-wrap items-baseline gap-x-2 border-b border-line/50 pb-2">
                      <span className="font-semibold text-heading">{e.action}</span>
                      <span className="text-muted">{nameById.get(e.product_id) ?? "product"}</span>
                      {e.field_changed && (
                        <span className="text-muted-soft">
                          · {e.field_changed}: {e.old_value ?? "—"} → {e.new_value ?? "—"}
                        </span>
                      )}
                      <span className="ml-auto text-sm text-muted-soft">
                        {new Date(e.created_at).toLocaleString("en-IN")}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {view === "team" && <TeamSection />}
        </main>
      </div>
    </div>
  );
}

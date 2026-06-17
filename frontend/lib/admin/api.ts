// Typed client for the admin API. Mirrors the FastAPI shapes in
// backend/app/schemas/{product,change_log}.py. Prices are whole rupees (INR).

import { API_URL } from "@/lib/api";
import { clearToken, getToken } from "@/lib/admin/auth";

export type ProductStatus = "draft" | "scheduled" | "live" | "inactive";

/** Fixed top-level category. Every product is Women or Men; the storefront's
 *  "All" tab is just a view that shows both. */
export type ProductAudience = "women" | "men";

export type AdminProduct = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock_quantity: number;
  images: string[];
  audience: ProductAudience;
  subcategory: string | null;
  status: ProductStatus;
  is_active: boolean;
  go_live_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ProductInput = {
  name: string;
  description?: string | null;
  price: number;
  stock_quantity: number;
  images: string[];
  audience: ProductAudience;
  subcategory?: string | null;
  status: ProductStatus;
  go_live_at?: string | null;
};

export type ChangeLogEntry = {
  id: string;
  admin_id: string;
  product_id: string;
  action: "create" | "update" | "delete";
  field_changed: string | null;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
};

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/** Pull a human message out of FastAPI's {detail: string | [{msg}]} body. */
async function messageFor(res: Response, fallback: string): Promise<string> {
  try {
    const body = await res.json();
    const detail = body?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg as string;
  } catch {
    /* non-JSON body */
  }
  return fallback;
}

async function authFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = getToken();
  // Let the browser set the multipart boundary itself for FormData bodies;
  // only JSON requests need an explicit Content-Type.
  const isForm = init.body instanceof FormData;
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      ...(isForm ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });
  if (res.status === 401) {
    clearToken();
    throw new ApiError("Your session has expired. Please log in again.", 401);
  }
  return res;
}

export async function login(email: string, password: string): Promise<string> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    throw new ApiError(
      res.status === 401 ? "Invalid email or password." : await messageFor(res, "Login failed."),
      res.status,
    );
  }
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

export async function listProducts(): Promise<AdminProduct[]> {
  const res = await authFetch("/admin/products");
  if (!res.ok) throw new ApiError(await messageFor(res, "Could not load products."), res.status);
  return ((await res.json()) as { products: AdminProduct[] }).products;
}

export async function createProduct(input: ProductInput): Promise<AdminProduct> {
  const res = await authFetch("/admin/products", { method: "POST", body: JSON.stringify(input) });
  if (!res.ok) throw new ApiError(await messageFor(res, "Could not create product."), res.status);
  return (await res.json()) as AdminProduct;
}

export async function updateProduct(
  id: string,
  patch: Partial<ProductInput>,
): Promise<AdminProduct> {
  const res = await authFetch(`/admin/products/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new ApiError(await messageFor(res, "Could not update product."), res.status);
  return (await res.json()) as AdminProduct;
}

export async function deleteProduct(id: string): Promise<AdminProduct> {
  const res = await authFetch(`/admin/products/${id}`, { method: "DELETE" });
  if (!res.ok) throw new ApiError(await messageFor(res, "Could not delete product."), res.status);
  return (await res.json()) as AdminProduct;
}

/** Upload product images/videos to object storage; returns their public URLs
 *  in the same order. The form then appends these to the product's image list. */
export async function uploadMedia(files: File[]): Promise<string[]> {
  const form = new FormData();
  for (const file of files) form.append("files", file);
  const res = await authFetch("/admin/uploads", { method: "POST", body: form });
  if (!res.ok) throw new ApiError(await messageFor(res, "Upload failed."), res.status);
  return ((await res.json()) as { urls: string[] }).urls;
}

export async function listChangeLog(): Promise<ChangeLogEntry[]> {
  const res = await authFetch("/admin/change-log");
  if (!res.ok) throw new ApiError(await messageFor(res, "Could not load history."), res.status);
  return ((await res.json()) as { entries: ChangeLogEntry[] }).entries;
}

/** Format whole-rupee price with Indian digit grouping, e.g. 1850 -> "₹1,850". */
export function formatRupees(price: number): string {
  return `₹${price.toLocaleString("en-IN")}`;
}

// ---- Admin team management --------------------------------------------------

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
};

export type AdminUserInput = { name: string; email: string; password: string };

export async function listAdmins(): Promise<AdminUser[]> {
  const res = await authFetch("/admin/users");
  if (!res.ok) throw new ApiError(await messageFor(res, "Could not load admins."), res.status);
  return ((await res.json()) as { admins: AdminUser[] }).admins;
}

export async function createAdmin(input: AdminUserInput): Promise<AdminUser> {
  const res = await authFetch("/admin/users", { method: "POST", body: JSON.stringify(input) });
  if (!res.ok) throw new ApiError(await messageFor(res, "Could not add admin."), res.status);
  return (await res.json()) as AdminUser;
}

export async function setAdminActive(id: string, isActive: boolean): Promise<AdminUser> {
  const res = await authFetch(`/admin/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ is_active: isActive }),
  });
  if (!res.ok) throw new ApiError(await messageFor(res, "Could not update admin."), res.status);
  return (await res.json()) as AdminUser;
}

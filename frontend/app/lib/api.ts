"use client";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://127.0.0.1:8000";

type ApiFetchOptions = RequestInit & { skipAuth?: boolean };

export async function apiFetch(path: string, opts: ApiFetchOptions = {}) {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;

  const headers = new Headers(opts.headers || {});
  if (!headers.has("Content-Type") && opts.body) {
    headers.set("Content-Type", "application/json");
  }

  if (!opts.skipAuth) {
    const token = localStorage.getItem("subsaver_token");
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(url, {
    ...opts,
    headers,
  });

  // Auto logout on 401
  if (res.status === 401) {
    localStorage.removeItem("subsaver_token");
    if (typeof window !== "undefined") window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = data?.detail || data?.message || `Request failed (${res.status})`;
    throw new Error(msg);
  }

  return data;
}

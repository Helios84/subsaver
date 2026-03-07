"use client";

const API_BASE = "/backend_api";

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

  try {
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
      // Pydantic v2 returns detail as array of objects [{type, loc, msg, ...}]
      // We need to always convert to a string
      const rawDetail = data?.detail ?? data?.message;
      let msg: string;
      if (Array.isArray(rawDetail)) {
        // Pydantic validation error — pick the first meaningful message
        msg = rawDetail.map((e: any) => e?.msg ?? JSON.stringify(e)).join(", ");
      } else if (typeof rawDetail === "string") {
        msg = rawDetail;
      } else {
        msg = `Request failed (${res.status})`;
      }
      throw new Error(msg);
    }

    return data;
  } catch (err) {
    console.error("[API DEBUG] Fetch Error:", err);
    throw err;
  }
}

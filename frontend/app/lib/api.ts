const API_BASE = "/backend_api";

type ApiFetchOptions = RequestInit & { skipAuth?: boolean; timeoutMs?: number };

/**
 * Call the API through the /backend_api proxy. T is the expected response body;
 * callers that ignore the body can leave it as unknown.
 */
export async function apiFetch<T = unknown>(path: string, opts: ApiFetchOptions = {}): Promise<T> {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;

  // AbortController with configurable timeout (default 15s)
  const controller = new AbortController();
  const timeoutMs = opts.timeoutMs ?? 15000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const headers = new Headers(opts.headers || {});
  if (!headers.has("Content-Type") && opts.body) {
    headers.set("Content-Type", "application/json");
  }

  if (!opts.skipAuth) {
    const token = typeof window !== "undefined" ? localStorage.getItem("subsaver_token") : null;
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  try {
    const res = await fetch(url, {
      ...opts,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Auto logout on 401
    if (res.status === 401) {
      localStorage.removeItem("subsaver_token");
      if (typeof window !== "undefined") window.location.href = "/login";
      throw new Error("Unauthorized");
    }

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      // Pydantic v2 returns detail as array of objects [{type, loc, msg, ...}]
      const rawDetail = data?.detail ?? data?.message;
      let msg: string;
      if (Array.isArray(rawDetail)) {
        msg = rawDetail.map((e: { msg?: string }) => e?.msg ?? JSON.stringify(e)).join(", ");
      } else if (typeof rawDetail === "string") {
        msg = rawDetail;
      } else {
        msg = `Request failed (${res.status})`;
      }
      throw new Error(msg);
    }

    return data as T;
  } catch (err) {
    clearTimeout(timeoutId);

    // Friendly timeout error
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("Request timed out. Please check your connection and try again.");
    }

    if (process.env.NODE_ENV === "development") {
      console.error("[API] Fetch Error:", err);
    }
    throw err;
  }
}

/** Message of a caught error, or the fallback when it has none. */
export function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

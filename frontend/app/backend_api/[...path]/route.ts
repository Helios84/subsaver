/**
 * Proxy from the browser to the FastAPI backend.
 *
 * The browser only ever calls /backend_api/* on this site. This handler forwards
 * each call to BACKEND_URL and adds two headers the browser cannot set itself:
 *
 *   x-proxy-secret  PROXY_SHARED_SECRET (server-only). When the backend has the
 *                   same secret configured, it rejects any request without it, so
 *                   the API cannot be called directly, bypassing this site.
 *   x-client-ip     The visitor's IP, used by the backend for rate limits. On
 *                   Vercel, x-forwarded-for / x-real-ip are set by the platform
 *                   and cannot be forged by the client.
 *
 * With PROXY_SHARED_SECRET unset (local development) it is a plain pass-through.
 */
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const BACKEND_URL = (process.env.BACKEND_URL ?? "http://127.0.0.1:8000").replace(/\/+$/, "");
const SECRET = process.env.PROXY_SHARED_SECRET;

// Request headers passed on to the API; everything else (cookies included) is dropped.
const REQUEST_HEADERS = ["authorization", "content-type", "accept"];
// Response headers passed back to the browser.
const RESPONSE_HEADERS = ["content-type", "retry-after", "cache-control"];

function clientIp(req: NextRequest): string | null {
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  const forwarded = req.headers.get("x-forwarded-for");
  return forwarded ? forwarded.split(",")[0].trim() : null;
}

async function proxy(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const target = new URL(`${BACKEND_URL}/${path.map(encodeURIComponent).join("/")}`);
  target.search = req.nextUrl.search;

  const headers = new Headers();
  for (const name of REQUEST_HEADERS) {
    const value = req.headers.get(name);
    if (value) headers.set(name, value);
  }
  const ip = clientIp(req);
  if (ip) headers.set("x-client-ip", ip);
  if (SECRET) headers.set("x-proxy-secret", SECRET);

  const hasBody = req.method !== "GET" && req.method !== "HEAD";

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: req.method,
      headers,
      body: hasBody ? await req.arrayBuffer() : undefined,
      cache: "no-store",
      redirect: "manual",
    });
  } catch {
    return Response.json({ detail: "The API is not reachable right now. Please try again later." }, { status: 502 });
  }

  const out = new Headers();
  for (const name of RESPONSE_HEADERS) {
    const value = upstream.headers.get(name);
    if (value) out.set(name, value);
  }
  // 204/304 responses must not carry a body
  const body = upstream.status === 204 || upstream.status === 304 ? null : upstream.body;
  return new Response(body, { status: upstream.status, headers: out });
}

export { proxy as GET, proxy as POST, proxy as PUT, proxy as PATCH, proxy as DELETE };

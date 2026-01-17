"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const [token, setToken] = useState<string>("");

  useEffect(() => {
    const t = localStorage.getItem("subsaver_token");
    if (!t) {
      router.push("/login");
      return;
    }
    setToken(t);
  }, [router]);

  function logout() {
    localStorage.removeItem("subsaver_token");
    router.push("/login");
  }

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Dashboard</h1>

          <div className="flex gap-4">
            <Link className="underline text-white/70" href="/">
              Home
            </Link>

            <button className="underline text-white/70" onClick={logout}>
              Logout
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <p className="text-white/70">Authenticated token:</p>
          <pre className="mt-2 text-sm text-white/80">{token}</pre>
        </div>
      </div>
    </main>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";

export default function Home() {
  const [apiStatus, setApiStatus] = useState<string>("");

  async function checkBackend() {
    try {
      const res = await fetch("http://127.0.0.1:8000/health");
      const data = await res.json();
      setApiStatus(data.status);
    } catch {
      setApiStatus("error");
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <h1 className="text-4xl font-bold mb-2">SubSaver</h1>
      <p className="text-lg text-white/60 mb-6">
        Track and manage your subscriptions
      </p>

      <div className="flex gap-3 mb-6">
        <Link href="/login">Log in</Link>
        <Link href="/register">Create account</Link>
        <Link href="/dashboard">Dashboard</Link>
      </div>

      <button
        onClick={checkBackend}
        className="rounded border px-4 py-2"
      >
        Check backend
      </button>

      {apiStatus && (
        <p className="mt-3 text-sm text-white/70">
          Backend status: <b>{apiStatus}</b>
        </p>
      )}
    </main>
  );
}

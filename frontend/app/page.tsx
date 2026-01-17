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
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-white">
      <div className="max-w-2xl w-full text-center space-y-8">
        <div className="space-y-3">
          <h1 className="text-6xl font-bold tracking-tight text-gray-900">
            Sub<span className="text-red-600">Saver</span>
          </h1>
          <p className="text-xl text-gray-600 font-light">
            Track and manage your subscriptions
          </p>
        </div>

        <div className="flex gap-4 justify-center items-center flex-wrap">
          <Link
            href="/login"
            className="px-8 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 shadow-sm"
          >
            Log in
          </Link>
          <Link
            href="/register"
            className="px-8 py-3 bg-white text-gray-700 font-medium rounded-lg border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
          >
            Create account
          </Link>
          <Link
            href="/dashboard"
            className="px-8 py-3 text-gray-600 font-medium hover:text-gray-900 underline underline-offset-4"
          >
            Dashboard
          </Link>
        </div>

        <div className="pt-8 space-y-3">
          <button
            onClick={checkBackend}
            className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium"
          >
            Check backend status
          </button>

          {apiStatus && (
            <p className="text-sm text-gray-600">
              Backend status: <span className="font-semibold text-gray-900">{apiStatus}</span>
            </p>
          )}
        </div>
      </div>
    </main>
  );
}

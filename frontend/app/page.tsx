import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <h1 className="text-4xl font-bold mb-2">SubSaver</h1>
      <p className="text-lg text-white/60 mb-6">
        Track and manage your subscriptions
      </p>

      <div className="flex gap-3">
        <Link
          className="rounded-xl bg-white text-black px-4 py-2 font-medium"
          href="/login"
        >
          Log in
        </Link>

        <Link
          className="rounded-xl border border-white/15 px-4 py-2 font-medium"
          href="/register"
        >
          Create account
        </Link>

        <Link
          className="rounded-xl border border-white/15 px-4 py-2 font-medium"
          href="/dashboard"
        >
          Dashboard
        </Link>
      </div>
    </main>
  );
}

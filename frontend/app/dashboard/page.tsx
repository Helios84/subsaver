import Link from "next/link";

export default function DashboardPage() {
  return (
    <main className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <Link className="underline text-white/70" href="/">
            Home
          </Link>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <p className="text-white/70">
            This is a placeholder dashboard. Next we will add:
          </p>

          <ul className="list-disc pl-5 mt-3 text-white/70 space-y-1">
            <li>My Subscriptions table</li>
            <li>Add subscription form</li>
            <li>Status: Active / Cancelled</li>
          </ul>
        </div>
      </div>
    </main>
  );
}

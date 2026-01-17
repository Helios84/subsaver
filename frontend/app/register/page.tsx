import Link from "next/link";

export default function RegisterPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6">
        <h1 className="text-2xl font-semibold mb-1">Create account</h1>
        <p className="text-sm text-white/60 mb-6">
          Start tracking subscriptions in minutes.
        </p>

        <form className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input
              type="email"
              className="w-full rounded-xl bg-black/20 border border-white/10 px-3 py-2 outline-none"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Password</label>
            <input
              type="password"
              className="w-full rounded-xl bg-black/20 border border-white/10 px-3 py-2 outline-none"
              placeholder="Create a password"
            />
          </div>

          <button
            type="button"
            className="w-full rounded-xl bg-white text-black font-medium py-2"
          >
            Create account
          </button>
        </form>

        <p className="text-sm text-white/60 mt-4">
          Already have an account?{" "}
          <Link className="underline" href="/login">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch } from "../lib/api";

type BillingCycle = "monthly" | "yearly";
type Status = "active" | "cancelled";

type Sub = {
  id: number;
  name: string;
  price_cents: number;
  billing_cycle: BillingCycle;
  status: Status;
  created_at: string;
};

function formatMoney(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function DashboardPage() {
  const router = useRouter();

  const [subs, setSubs] = useState<Sub[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [msg, setMsg] = useState<string>("");

  // Create form
  const [name, setName] = useState("");
  const [priceCents, setPriceCents] = useState<number>(999);
  const [cycle, setCycle] = useState<BillingCycle>("monthly");

  // Edit state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editPriceCents, setEditPriceCents] = useState<number>(0);
  const [editCycle, setEditCycle] = useState<BillingCycle>("monthly");
  const [editStatus, setEditStatus] = useState<Status>("active");

  const totalMonthly = useMemo(() => {
    const sum = subs
      .filter((s) => s.status === "active")
      .reduce((acc, s) => {
        const monthly =
          s.billing_cycle === "monthly"
            ? s.price_cents
            : Math.round(s.price_cents / 12);
        return acc + monthly;
      }, 0);
    return formatMoney(sum);
  }, [subs]);

  useEffect(() => {
    const t = localStorage.getItem("subsaver_token");
    if (!t) router.push("/login");
  }, [router]);

  async function load() {
    setMsg("");
    setLoading(true);
    try {
      const data = await apiFetch("/subscriptions", { method: "GET" });
      setSubs(data);
    } catch (err: any) {
      setMsg(err?.message ?? "Failed to load subscriptions");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function logout() {
    localStorage.removeItem("subsaver_token");
    router.push("/login");
  }

  async function createSub(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    try {
      await apiFetch("/subscriptions", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          price_cents: Math.max(0, Math.round(priceCents)),
          billing_cycle: cycle,
          status: "active",
        }),
      });
      setName("");
      setPriceCents(999);
      setCycle("monthly");
      await load();
    } catch (err: any) {
      setMsg(err?.message ?? "Create failed");
    }
  }

  function startEdit(s: Sub) {
    setEditingId(s.id);
    setEditName(s.name);
    setEditPriceCents(s.price_cents);
    setEditCycle(s.billing_cycle);
    setEditStatus(s.status);
    setMsg("");
  }

  function cancelEdit() {
    setEditingId(null);
    setMsg("");
  }

  async function saveEdit(subId: number) {
    setMsg("");
    try {
      const updated = await apiFetch(`/subscriptions/${subId}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: editName.trim(),
          price_cents: Math.max(0, Math.round(editPriceCents)),
          billing_cycle: editCycle,
          status: editStatus,
        }),
      });

      setSubs((prev) => prev.map((s) => (s.id === subId ? updated : s)));
      setEditingId(null);
    } catch (err: any) {
      setMsg(err?.message ?? "Update failed");
    }
  }

  async function toggleStatus(s: Sub) {
    setMsg("");
    const next: Status = s.status === "active" ? "cancelled" : "active";

    // optimistic UI
    setSubs((prev) => prev.map((x) => (x.id === s.id ? { ...x, status: next } : x)));

    try {
      const updated = await apiFetch(`/subscriptions/${s.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: next }),
      });
      setSubs((prev) => prev.map((x) => (x.id === s.id ? updated : x)));
    } catch (err: any) {
      // rollback
      setSubs((prev) => prev.map((x) => (x.id === s.id ? s : x)));
      setMsg(err?.message ?? "Toggle failed");
    }
  }

  async function deleteSub(subId: number) {
    const ok = confirm("Delete this subscription?");
    if (!ok) return;

    setMsg("");
    try {
      await apiFetch(`/subscriptions/${subId}`, { method: "DELETE" });
      setSubs((prev) => prev.filter((s) => s.id !== subId));
      if (editingId === subId) setEditingId(null);
    } catch (err: any) {
      setMsg(err?.message ?? "Delete failed");
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Sub<span className="text-red-600">Saver</span>
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Active monthly spend: <span className="font-semibold text-red-600">{totalMonthly}</span>
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Link className="text-sm text-gray-600 hover:text-gray-900 font-medium" href="/">
              Home
            </Link>
            <button onClick={logout} className="text-sm text-gray-600 hover:text-gray-900 font-medium">
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
          {/* Create */}
          <section className="bg-white rounded-2xl border border-gray-200 p-6 h-fit shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900">Add subscription</h2>
              <button onClick={load} className="text-xs text-gray-500 hover:text-gray-700 font-medium">
                Refresh
              </button>
            </div>

            <form className="space-y-4" onSubmit={createSub}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none transition text-sm"
                  placeholder="Netflix"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price (cents)</label>
                <input
                  value={priceCents}
                  onChange={(e) => setPriceCents(Number(e.target.value))}
                  type="number"
                  min={0}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none transition text-sm"
                />
                <p className="mt-1.5 text-xs text-gray-500">Example: $15.99 = 1599</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Billing cycle</label>
                <select
                  value={cycle}
                  onChange={(e) => setCycle(e.target.value as BillingCycle)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none transition text-sm"
                >
                  <option value="monthly">monthly</option>
                  <option value="yearly">yearly</option>
                </select>
              </div>

              <button className="w-full bg-red-600 text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-red-700 transition shadow-sm">
                Create
              </button>

              {msg && <p className="text-xs text-red-600 pt-2 bg-red-50 p-3 rounded-lg">{msg}</p>}
            </form>
          </section>

          {/* List */}
          <section className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900">Your subscriptions</h2>
              <span className="text-xs text-gray-500 font-medium">{subs.length} total</span>
            </div>

            {loading ? (
              <p className="text-sm text-gray-600">Loading…</p>
            ) : subs.length === 0 ? (
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-center">
                <p className="text-sm text-gray-700 font-medium">No subscriptions yet</p>
                <p className="text-xs text-gray-500 mt-1">Add your first one on the left</p>
              </div>
            ) : (
              <div className="space-y-3">
                {subs.map((s) => {
                  const isEditing = editingId === s.id;

                  return (
                    <div key={s.id} className="rounded-xl border border-gray-200 bg-gray-50 p-4 hover:border-gray-300 transition">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          {!isEditing ? (
                            <>
                              <p className="font-semibold text-gray-900 truncate">{s.name}</p>
                              <p className="text-xs text-gray-600 mt-1.5 flex items-center gap-2">
                                <span className="capitalize">{s.billing_cycle}</span>
                                <span>•</span>
                                <span className={s.status === "active" ? "text-red-600 font-medium" : "text-gray-500"}>
                                  {s.status}
                                </span>
                                <span>•</span>
                                <span className="font-semibold text-gray-900">{formatMoney(s.price_cents)}</span>
                              </p>
                            </>
                          ) : (
                            <div className="space-y-3">
                              <div className="grid gap-3 sm:grid-cols-2">
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
                                  <input
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none transition text-sm"
                                  />
                                </div>

                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">Price (cents)</label>
                                  <input
                                    type="number"
                                    min={0}
                                    value={editPriceCents}
                                    onChange={(e) => setEditPriceCents(Number(e.target.value))}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none transition text-sm"
                                  />
                                </div>
                              </div>

                              <div className="grid gap-3 sm:grid-cols-2">
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">Billing cycle</label>
                                  <select
                                    value={editCycle}
                                    onChange={(e) => setEditCycle(e.target.value as BillingCycle)}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none transition text-sm"
                                  >
                                    <option value="monthly">monthly</option>
                                    <option value="yearly">yearly</option>
                                  </select>
                                </div>

                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                                  <select
                                    value={editStatus}
                                    onChange={(e) => setEditStatus(e.target.value as Status)}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none transition text-sm"
                                  >
                                    <option value="active">active</option>
                                    <option value="cancelled">cancelled</option>
                                  </select>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {!isEditing ? (
                            <>
                              <button
                                onClick={() => toggleStatus(s)}
                                className={`px-3 py-2 text-xs font-semibold rounded-lg transition ${s.status === "active"
                                    ? "bg-red-600 text-white hover:bg-red-700"
                                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                  }`}
                                title="Toggle active/cancelled"
                              >
                                {s.status === "active" ? "Cancel" : "Activate"}
                              </button>

                              <button
                                onClick={() => startEdit(s)}
                                className="px-3 py-2 text-xs font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
                              >
                                Edit
                              </button>

                              <button
                                onClick={() => deleteSub(s.id)}
                                className="px-3 py-2 text-xs font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
                              >
                                Delete
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => saveEdit(s.id)}
                                className="px-3 py-2 text-xs font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
                              >
                                Save
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="px-3 py-2 text-xs font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {msg && (
              <p className="text-xs text-red-600 mt-4 border-t border-gray-200 pt-4 bg-red-50 p-3 rounded-lg">{msg}</p>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

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
    <main className="min-h-screen bg-black text-white">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-black/70 backdrop-blur">
        <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">SubSaver</h1>
            <p className="text-sm text-white/60">
              Active monthly spend: <span className="text-white">{totalMonthly}</span>
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Link className="text-sm text-white/70 hover:text-white" href="/">
              Home
            </Link>
            <button onClick={logout} className="text-sm text-white/70 hover:text-white">
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          {/* Create */}
          <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white/90">Add subscription</h2>
              <button onClick={load} className="text-xs text-white/60 hover:text-white">
                Refresh
              </button>
            </div>

            <form className="space-y-3" onSubmit={createSub}>
              <div>
                <label className="block text-xs text-white/60 mb-1">Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-sm outline-none focus:border-white/25"
                  placeholder="Netflix"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-white/60 mb-1">Price (cents)</label>
                <input
                  value={priceCents}
                  onChange={(e) => setPriceCents(Number(e.target.value))}
                  type="number"
                  min={0}
                  className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-sm outline-none focus:border-white/25"
                />
                <p className="mt-1 text-[11px] text-white/45">Example: $15.99 = 1599</p>
              </div>

              <div>
                <label className="block text-xs text-white/60 mb-1">Billing cycle</label>
                <select
                  value={cycle}
                  onChange={(e) => setCycle(e.target.value as BillingCycle)}
                  className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-sm outline-none focus:border-white/25"
                >
                  <option value="monthly">monthly</option>
                  <option value="yearly">yearly</option>
                </select>
              </div>

              <button className="w-full rounded-xl bg-white text-black text-sm font-medium py-2 hover:bg-white/90">
                Create
              </button>

              {msg && <p className="text-xs text-white/70 pt-2">{msg}</p>}
            </form>
          </section>

          {/* List */}
          <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white/90">Your subscriptions</h2>
              <span className="text-xs text-white/50">{subs.length} total</span>
            </div>

            {loading ? (
              <p className="text-sm text-white/60">Loading…</p>
            ) : subs.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <p className="text-sm text-white/70">No subscriptions yet.</p>
                <p className="text-xs text-white/45 mt-1">Add your first one on the left.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {subs.map((s) => {
                  const isEditing = editingId === s.id;

                  return (
                    <div key={s.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          {!isEditing ? (
                            <>
                              <p className="font-medium truncate">{s.name}</p>
                              <p className="text-xs text-white/55 mt-1">
                                {s.billing_cycle} • {s.status} •{" "}
                                <span className="text-white/70">{formatMoney(s.price_cents)}</span>
                              </p>
                            </>
                          ) : (
                            <div className="space-y-2">
                              <div className="grid gap-2 sm:grid-cols-2">
                                <div>
                                  <label className="block text-[11px] text-white/55 mb-1">Name</label>
                                  <input
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-sm outline-none focus:border-white/25"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[11px] text-white/55 mb-1">Price (cents)</label>
                                  <input
                                    type="number"
                                    min={0}
                                    value={editPriceCents}
                                    onChange={(e) => setEditPriceCents(Number(e.target.value))}
                                    className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-sm outline-none focus:border-white/25"
                                  />
                                </div>
                              </div>

                              <div className="grid gap-2 sm:grid-cols-2">
                                <div>
                                  <label className="block text-[11px] text-white/55 mb-1">Billing cycle</label>
                                  <select
                                    value={editCycle}
                                    onChange={(e) => setEditCycle(e.target.value as BillingCycle)}
                                    className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-sm outline-none focus:border-white/25"
                                  >
                                    <option value="monthly">monthly</option>
                                    <option value="yearly">yearly</option>
                                  </select>
                                </div>

                                <div>
                                  <label className="block text-[11px] text-white/55 mb-1">Status</label>
                                  <select
                                    value={editStatus}
                                    onChange={(e) => setEditStatus(e.target.value as Status)}
                                    className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-sm outline-none focus:border-white/25"
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
                                className="rounded-xl bg-white px-3 py-2 text-xs font-medium text-black hover:bg-white/90"
                                title="Toggle active/cancelled"
                              >
                                {s.status === "active" ? "Cancel" : "Activate"}
                              </button>

                              <button
                                onClick={() => startEdit(s)}
                                className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white/80 hover:bg-white/10"
                              >
                                Edit
                              </button>

                              <button
                                onClick={() => deleteSub(s.id)}
                                className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white/80 hover:bg-white/10"
                              >
                                Delete
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => saveEdit(s.id)}
                                className="rounded-xl bg-white px-3 py-2 text-xs font-medium text-black hover:bg-white/90"
                              >
                                Save
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white/80 hover:bg-white/10"
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
              <p className="text-xs text-white/70 mt-4 border-t border-white/10 pt-4">{msg}</p>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ThemeToggle from "../components/ThemeToggle";
import NavMenu from "../components/NavMenu";

type Automation = {
  id: string;
  name: string;
  message: string;
  enabled: boolean;
  list: { id: string; name: string };
};

type ContactList = {
  id: string;
  name: string;
};

export default function Automations() {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [lists, setLists] = useState<ContactList[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [listId, setListId] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function loadData() {
    setLoading(true);
    const [autoRes, listsRes] = await Promise.all([
      fetch("/api/automations"),
      fetch("/api/lists"),
    ]);
    const autoData = await autoRes.json();
    const listsData = await listsRes.json();
    setAutomations(Array.isArray(autoData) ? autoData : []);
    setLists(Array.isArray(listsData) ? listsData : []);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!listId) {
      setError("Please select a contact list");
      return;
    }

    setSaving(true);

    const res = await fetch("/api/automations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, message, listId }),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Something went wrong");
      return;
    }

    setName("");
    setMessage("");
    setListId("");
    setShowForm(false);
    loadData();
  }

  async function toggleAutomation(a: Automation) {
    await fetch("/api/automations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: a.id, enabled: !a.enabled }),
    });
    loadData();
  }

  async function deleteAutomation(id: string) {
    if (!confirm("Delete this automation?")) return;
    await fetch("/api/automations", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    loadData();
  }

  return (
    <main className="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-white transition-colors">
      <nav className="flex items-center justify-between px-6 py-4 md:px-12 border-b border-slate-200 dark:border-slate-800">
        <Link href="/dashboard" className="text-lg font-bold">
          FlowPilot
        </Link>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <NavMenu />
        </div>
      </nav>

      <section className="px-6 py-12 md:px-12">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">Automations</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Create a message sequence and attach it to a contact list.
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-500"
          >
            {showForm ? "Cancel" : "+ New Automation"}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleAdd} className="mt-6 grid gap-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-6">
            <input
              type="text"
              placeholder="Automation name (e.g. Welcome Sequence)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
            />

            <select
              value={listId}
              onChange={(e) => setListId(e.target.value)}
              required
              className="rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-4 py-3 text-slate-900 dark:text-white"
            >
              <option value="">Select a contact list...</option>
              {lists.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>

            <textarea
              placeholder="Message to send"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={3}
              className="rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
            />

            {error && <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Create Automation"}
            </button>
          </form>
        )}

        <div className="mt-8">
          {loading ? (
            <p className="text-slate-500 dark:text-slate-400">Loading...</p>
          ) : automations.length === 0 ? (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-8 text-center text-slate-500 dark:text-slate-400">
              No automations yet. Create your first one above.
            </div>
          ) : (
            <div className="grid gap-3">
              {automations.map((a) => (
                <div key={a.id} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold">{a.name}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{a.message}</p>
                    <Link href={`/lists/${a.list.id}`} className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1 inline-block">
                      List: {a.list.name}
                    </Link>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs rounded-full px-2 py-0.5 ${a.enabled ? "bg-green-100 dark:bg-green-600/20 text-green-700 dark:text-green-300" : "bg-slate-200 dark:bg-slate-800 text-slate-500"}`}>
                      {a.enabled ? "Active" : "Paused"}
                    </span>
                    <button
                      onClick={() => toggleAutomation(a)}
                      className="rounded border border-slate-300 dark:border-slate-600 px-3 py-1 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      {a.enabled ? "Pause" : "Activate"}
                    </button>
                    <button
                      onClick={() => deleteAutomation(a.id)}
                      className="rounded border border-red-300 dark:border-red-700 px-3 py-1 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ThemeToggle from "../components/ThemeToggle";

type ContactList = {
  id: string;
  name: string;
  killSwitchTag: string | null;
  contacts: { id: string }[];
};

export default function Lists() {
  const [lists, setLists] = useState<ContactList[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState("");
  const [killSwitchTag, setKillSwitchTag] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editTag, setEditTag] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function loadLists() {
    setLoading(true);
    const res = await fetch("/api/lists");
    const data = await res.json();
    setLists(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => {
    loadLists();
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const res = await fetch("/api/lists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, killSwitchTag: killSwitchTag || null }),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Something went wrong");
      return;
    }

    setName("");
    setKillSwitchTag("");
    setShowForm(false);
    loadLists();
  }

  function startEdit(l: ContactList) {
    setEditingId(l.id);
    setEditName(l.name);
    setEditTag(l.killSwitchTag || "");
  }

  async function handleEditSave(id: string) {
    setEditSaving(true);

    const res = await fetch("/api/lists", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, name: editName, killSwitchTag: editTag || null }),
    });

    setEditSaving(false);

    if (res.ok) {
      setEditingId(null);
      loadLists();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this list? Contacts will not be deleted, only removed from the list.")) return;

    setDeletingId(id);

    const res = await fetch("/api/lists", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    setDeletingId(null);

    if (res.ok) {
      loadLists();
    }
  }

  return (
    <main className="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-white transition-colors">
      <nav className="flex items-center justify-between px-6 py-4 md:px-12 border-b border-slate-200 dark:border-slate-800">
        <Link href="/dashboard" className="text-lg font-bold">
          FlowPilot
        </Link>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Link href="/dashboard" className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
            Back to Dashboard
          </Link>
        </div>
      </nav>

      <section className="px-6 py-12 md:px-12">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">Contact Lists</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Group contacts and set a kill switch tag to auto-stop automations for that list.
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-500"
          >
            {showForm ? "Cancel" : "+ New List"}
          </button>
        </div>

        {showForm && (
          <form
            onSubmit={handleAdd}
            className="mt-6 grid gap-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-6 md:grid-cols-2"
          >
            <input
              type="text"
              placeholder="List name (e.g. Course Buyers)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
            />
            <input
              type="text"
              placeholder="Kill switch tag (e.g. Purchased_Course)"
              value={killSwitchTag}
              onChange={(e) => setKillSwitchTag(e.target.value)}
              className="rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
            />
            {error && <p className="text-red-600 dark:text-red-400 text-sm md:col-span-2">{error}</p>}
            <button
              type="submit"
              disabled={saving}
              className="md:col-span-2 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Create List"}
            </button>
          </form>
        )}

        <div className="mt-8">
          {loading ? (
            <p className="text-slate-500 dark:text-slate-400">Loading lists...</p>
          ) : lists.length === 0 ? (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-8 text-center text-slate-500 dark:text-slate-400">
              No lists yet. Create your first one above.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {lists.map((l) =>
                editingId === l.id ? (
                  <div key={l.id} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-6">
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-3 py-2 text-slate-900 dark:text-white mb-3"
                    />
                    <input
                      value={editTag}
                      onChange={(e) => setEditTag(e.target.value)}
                      placeholder="Kill switch tag"
                      className="w-full rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-3 py-2 text-slate-900 dark:text-white mb-3"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditSave(l.id)}
                        disabled={editSaving}
                        className="rounded bg-blue-600 px-3 py-1.5 text-white text-sm font-semibold hover:bg-blue-500 disabled:opacity-50"
                      >
                        {editSaving ? "Saving..." : "Save"}
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="rounded border border-slate-300 dark:border-slate-600 px-3 py-1.5 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div key={l.id} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-6">
                    <h3 className="text-lg font-bold">{l.name}</h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      {l.contacts.length} contact{l.contacts.length !== 1 ? "s" : ""}
                    </p>
                    {l.killSwitchTag ? (
                      <p className="mt-2 text-xs">
                        <span className="rounded-full bg-red-100 dark:bg-red-600/20 px-2 py-0.5 text-red-700 dark:text-red-300">
                          Kill switch: {l.killSwitchTag}
                        </span>
                      </p>
                    ) : (
                      <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">No kill switch tag set</p>
                    )}
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => startEdit(l)}
                        className="rounded border border-slate-300 dark:border-slate-600 px-3 py-1 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(l.id)}
                        disabled={deletingId === l.id}
                        className="rounded border border-red-300 dark:border-red-700 px-3 py-1 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 disabled:opacity-50"
                      >
                        {deletingId === l.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
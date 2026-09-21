"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Contact = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  tags: string[];
};

export default function Contacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [tags, setTags] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importTag, setImportTag] = useState("");
  const [importError, setImportError] = useState("");
  const [importResult, setImportResult] = useState<{ created: number; updated: number } | null>(null);
  const [importing, setImporting] = useState(false);

  async function loadContacts() {
    setLoading(true);
    const res = await fetch("/api/contacts");
    const data = await res.json();
    setContacts(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => {
    loadContacts();
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const tagList = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const res = await fetch("/api/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, phone, tags: tagList }),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Something went wrong");
      return;
    }

    setName("");
    setEmail("");
    setPhone("");
    setTags("");
    setShowForm(false);
    loadContacts();
  }

  async function handleImport(e: React.FormEvent) {
    e.preventDefault();
    setImportError("");
    setImportResult(null);

    if (!csvFile) {
      setImportError("Please choose a CSV file");
      return;
    }
    if (!importTag.trim()) {
      setImportError("Please enter a tag to apply");
      return;
    }

    setImporting(true);

    const text = await csvFile.text();
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    // Skip a header row if it looks like one (contains "email" or "phone" as text)
    const firstLine = lines[0]?.toLowerCase() || "";
    const dataLines =
      firstLine.includes("email") || firstLine.includes("phone")
        ? lines.slice(1)
        : lines;

    // Take just the first column of each line
    const entries = dataLines.map((line) => line.split(",")[0].trim());

    const res = await fetch("/api/contacts-import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entries, tag: importTag.trim() }),
    });

    setImporting(false);

    if (!res.ok) {
      const data = await res.json();
      setImportError(data.error || "Something went wrong");
      return;
    }

    const data = await res.json();
    setImportResult(data);
    setCsvFile(null);
    setImportTag("");
    loadContacts();
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <nav className="flex items-center justify-between px-6 py-4 md:px-12 border-b border-slate-800">
        <Link href="/dashboard" className="text-lg font-bold">
          FlowPilot
        </Link>
        <Link href="/dashboard" className="text-sm text-slate-400 hover:text-white">
          ← Back to Dashboard
        </Link>
      </nav>

      <section className="px-6 py-12 md:px-12">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-bold">Contacts</h1>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowImport(!showImport);
                setShowForm(false);
              }}
              className="rounded-lg border border-slate-600 px-5 py-2.5 font-semibold hover:bg-slate-800"
            >
              {showImport ? "Cancel" : "Import CSV"}
            </button>
            <button
              onClick={() => {
                setShowForm(!showForm);
                setShowImport(false);
              }}
              className="rounded-lg bg-blue-600 px-5 py-2.5 font-semibold hover:bg-blue-500"
            >
              {showForm ? "Cancel" : "+ Add Contact"}
            </button>
          </div>
        </div>

        {showImport && (
          <form
            onSubmit={handleImport}
            className="mt-6 rounded-xl border border-slate-800 bg-slate-900/50 p-6"
          >
            <p className="text-sm text-slate-400 mb-4">
              Upload a CSV with one email or phone number per row (first column).
              Existing contacts get this tag added; new numbers/emails get created with it.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                className="rounded-lg bg-slate-900 border border-slate-700 px-4 py-3 text-white file:mr-4 file:rounded file:border-0 file:bg-blue-600 file:px-3 file:py-1.5 file:text-white"
              />
              <input
                type="text"
                placeholder="Tag to apply (e.g. Purchased_Course)"
                value={importTag}
                onChange={(e) => setImportTag(e.target.value)}
                className="rounded-lg bg-slate-900 border border-slate-700 px-4 py-3 text-white placeholder-slate-500"
              />
            </div>
            {importError && <p className="mt-3 text-red-400 text-sm">{importError}</p>}
            {importResult && (
              <p className="mt-3 text-green-400 text-sm">
                Done — {importResult.created} new contact(s) created, {importResult.updated} existing contact(s) tagged.
              </p>
            )}
            <button
              type="submit"
              disabled={importing}
              className="mt-4 rounded-lg bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-500 disabled:opacity-50"
            >
              {importing ? "Importing..." : "Import & Tag"}
            </button>
          </form>
        )}

        {showForm && (
          <form
            onSubmit={handleAdd}
            className="mt-6 grid gap-4 rounded-xl border border-slate-800 bg-slate-900/50 p-6 md:grid-cols-2"
          >
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-lg bg-slate-900 border border-slate-700 px-4 py-3 text-white placeholder-slate-500"
            />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-lg bg-slate-900 border border-slate-700 px-4 py-3 text-white placeholder-slate-500"
            />
            <input
              type="text"
              placeholder="Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="rounded-lg bg-slate-900 border border-slate-700 px-4 py-3 text-white placeholder-slate-500"
            />
            <input
              type="text"
              placeholder="Tags (comma separated, e.g. lead, vip)"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="rounded-lg bg-slate-900 border border-slate-700 px-4 py-3 text-white placeholder-slate-500"
            />
            {error && <p className="text-red-400 text-sm md:col-span-2">{error}</p>}
            <button
              type="submit"
              disabled={saving}
              className="md:col-span-2 rounded-lg bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-500 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Contact"}
            </button>
          </form>
        )}

        <div className="mt-8">
          {loading ? (
            <p className="text-slate-400">Loading contacts...</p>
          ) : contacts.length === 0 ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-8 text-center text-slate-400">
              No contacts yet. Add your first one above.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-900/70 text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Phone</th>
                    <th className="px-4 py-3">Tags</th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.map((c) => (
                    <tr key={c.id} className="border-t border-slate-800">
                      <td className="px-4 py-3">{c.name || "—"}</td>
                      <td className="px-4 py-3">{c.email || "—"}</td>
                      <td className="px-4 py-3">{c.phone || "—"}</td>
                      <td className="px-4 py-3">
                        {c.tags.length > 0
                          ? c.tags.map((t) => (
                              <span
                                key={t}
                                className="mr-1 inline-block rounded-full bg-blue-600/20 px-2 py-0.5 text-xs text-blue-300"
                              >
                                {t}
                              </span>
                            ))
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
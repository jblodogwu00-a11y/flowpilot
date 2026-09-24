"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import ThemeToggle from "../../components/ThemeToggle";
import NavMenu from "../../components/NavMenu";

type Contact = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  tags: string[];
};

type ContactList = {
  id: string;
  name: string;
  killSwitchTag: string | null;
};

export default function ListDetail() {
  const params = useParams();
  const listId = params.id as string;

  const [list, setList] = useState<ContactList | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [tags, setTags] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [showImport, setShowImport] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importTag, setImportTag] = useState("");
  const [importError, setImportError] = useState("");
  const [importResult, setImportResult] = useState<{ created: number; updated: number; killSwitchTriggered: number } | null>(null);
  const [importing, setImporting] = useState(false);

  async function loadData() {
    setLoading(true);
    const [listsRes, contactsRes] = await Promise.all([
      fetch("/api/lists"),
      fetch(`/api/contacts?listId=${listId}`),
    ]);
    const listsData = await listsRes.json();
    const contactsData = await contactsRes.json();

    const found = Array.isArray(listsData) ? listsData.find((l: ContactList) => l.id === listId) : null;
    setList(found || null);
    setContacts(Array.isArray(contactsData) ? contactsData : []);
    setLoading(false);
  }

  useEffect(() => {
    if (listId) loadData();
  }, [listId]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const tagList = tags.split(",").map((t) => t.trim()).filter(Boolean);

    const res = await fetch("/api/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, phone, tags: tagList, listId }),
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
    loadData();
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
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const firstLine = lines[0]?.toLowerCase() || "";
    const dataLines = firstLine.includes("email") || firstLine.includes("phone") ? lines.slice(1) : lines;
    const entries = dataLines.map((line) => line.split(",")[0].trim());

    const res = await fetch("/api/contacts-import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entries, tag: importTag.trim(), listId }),
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
    loadData();
  }

  function isStopped(c: Contact) {
    return list?.killSwitchTag ? c.tags.includes(list.killSwitchTag) : false;
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
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold">{list?.name || "List"}</h1>
            {list?.killSwitchTag && (
              <p className="mt-2 text-sm">
                <span className="rounded-full bg-red-100 dark:bg-red-600/20 px-2 py-0.5 text-red-700 dark:text-red-300">
                  Kill switch tag: {list.killSwitchTag}
                </span>
              </p>
            )}
          </div>
          <Link
            href={`/automations`}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            View automations for this list →
          </Link>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={() => { setShowImport(!showImport); setShowForm(false); }}
            className="rounded-lg border border-slate-300 dark:border-slate-600 px-5 py-2.5 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {showImport ? "Cancel" : "Import CSV to this list"}
          </button>
          <button
            onClick={() => { setShowForm(!showForm); setShowImport(false); }}
            className="rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-500"
          >
            {showForm ? "Cancel" : "+ Add Contact to this list"}
          </button>
        </div>

        {showImport && (
          <form onSubmit={handleImport} className="mt-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-6">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Contacts will be added to this list and tagged. If the tag matches this list&apos;s kill switch tag, matching contacts are flagged.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                className="rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-4 py-3 text-slate-900 dark:text-white file:mr-4 file:rounded file:border-0 file:bg-blue-600 file:px-3 file:py-1.5 file:text-white"
              />
              <input
                type="text"
                placeholder="Tag to apply"
                value={importTag}
                onChange={(e) => setImportTag(e.target.value)}
                className="rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
              />
            </div>
            {importError && <p className="mt-3 text-red-600 dark:text-red-400 text-sm">{importError}</p>}
            {importResult && (
              <p className="mt-3 text-green-600 dark:text-green-400 text-sm">
                Done — {importResult.created} created, {importResult.updated} updated.
                {importResult.killSwitchTriggered > 0 && (
                  <span className="ml-1 text-red-600 dark:text-red-400">
                    {importResult.killSwitchTriggered} contact(s) matched the kill switch tag.
                  </span>
                )}
              </p>
            )}
            <button
              type="submit"
              disabled={importing}
              className="mt-4 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
            >
              {importing ? "Importing..." : "Import & Tag"}
            </button>
          </form>
        )}

        {showForm && (
          <form onSubmit={handleAdd} className="mt-6 grid gap-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-6 md:grid-cols-2">
            <input type="text" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} className="rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500" />
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500" />
            <input type="text" placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500" />
            <input type="text" placeholder="Tags (comma separated)" value={tags} onChange={(e) => setTags(e.target.value)} className="rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500" />
            {error && <p className="text-red-600 dark:text-red-400 text-sm md:col-span-2">{error}</p>}
            <button type="submit" disabled={saving} className="md:col-span-2 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-500 disabled:opacity-50">
              {saving ? "Saving..." : "Save Contact"}
            </button>
          </form>
        )}

        <div className="mt-8">
          {loading ? (
            <p className="text-slate-500 dark:text-slate-400">Loading...</p>
          ) : contacts.length === 0 ? (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-8 text-center text-slate-500 dark:text-slate-400">
              No contacts in this list yet.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-900/70 text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Phone</th>
                    <th className="px-4 py-3">Tags</th>
                    <th className="px-4 py-3">Automation Status</th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.map((c) => (
                    <tr key={c.id} className="border-t border-slate-200 dark:border-slate-800">
                      <td className="px-4 py-3">{c.name || "—"}</td>
                      <td className="px-4 py-3">{c.email || "—"}</td>
                      <td className="px-4 py-3">{c.phone || "—"}</td>
                      <td className="px-4 py-3">
                        {c.tags.length > 0
                          ? c.tags.map((t) => (
                              <span key={t} className="mr-1 inline-block rounded-full bg-blue-100 dark:bg-blue-600/20 px-2 py-0.5 text-xs text-blue-700 dark:text-blue-300">
                                {t}
                              </span>
                            ))
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {isStopped(c) ? (
                          <span className="rounded-full bg-red-100 dark:bg-red-600/20 px-2 py-0.5 text-xs text-red-700 dark:text-red-300">
                            Stopped (kill switch)
                          </span>
                        ) : (
                          <span className="rounded-full bg-green-100 dark:bg-green-600/20 px-2 py-0.5 text-xs text-green-700 dark:text-green-300">
                            Active
                          </span>
                        )}
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
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
  list: {
    id: string;
    name: string;
  };
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

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editMessage, setEditMessage] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  const [runningId, setRunningId] = useState<string | null>(null);
  const [runMessage, setRunMessage] = useState("");

  async function loadData() {
    setLoading(true);

    try {
      const [automationsResponse, listsResponse] =
        await Promise.all([
          fetch("/api/automations"),
          fetch("/api/lists"),
        ]);

      const automationsData =
        await automationsResponse.json();

      const listsData = await listsResponse.json();

      setAutomations(
        Array.isArray(automationsData)
          ? automationsData
          : []
      );

      setLists(
        Array.isArray(listsData)
          ? listsData
          : []
      );
    } catch {
      setError("Failed to load automations.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleAdd(
    e: React.FormEvent
  ) {
    e.preventDefault();

    setError("");

    if (!listId) {
      setError("Please select a contact list.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(
        "/api/automations",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            message,
            listId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            "Failed to create automation."
        );
        return;
      }

      setName("");
      setMessage("");
      setListId("");
      setShowForm(false);

      await loadData();
    } catch {
      setError(
        "Something went wrong while creating the automation."
      );
    } finally {
      setSaving(false);
    }
  }

  function startEdit(automation: Automation) {
    setEditingId(automation.id);
    setEditName(automation.name);
    setEditMessage(automation.message);
    setRunMessage("");
  }

  async function handleEditSave(id: string) {
    setEditSaving(true);

    try {
      const response = await fetch(
        "/api/automations",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id,
            name: editName,
            message: editMessage,
            enabled: true,
          }),
        }
      );

      if (response.ok) {
        setEditingId(null);
        await loadData();
      }
    } finally {
      setEditSaving(false);
    }
  }

  async function toggleAutomation(
    automation: Automation
  ) {
    setRunMessage("");

    await fetch("/api/automations", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: automation.id,
        enabled: !automation.enabled,
      }),
    });

    await loadData();
  }

  async function runAutomation(
    automation: Automation
  ) {
    if (!automation.enabled) {
      setRunMessage(
        "Activate the automation before running it."
      );
      return;
    }

    setRunningId(automation.id);
    setRunMessage("");

    try {
      const response = await fetch(
        "/api/automations/run",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            automationId: automation.id,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setRunMessage(
          data.error ||
            "Failed to run automation."
        );
        return;
      }

      setRunMessage(
        `"${automation.name}" finished — ${data.sent || 0} sent, ${data.skipped || 0} skipped, ${data.failed || 0} failed.`
      );
    } catch {
      setRunMessage(
        "Something went wrong while running the automation."
      );
    } finally {
      setRunningId(null);
    }
  }

  async function deleteAutomation(
    id: string
  ) {
    const confirmed = window.confirm(
      "Delete this automation?"
    );

    if (!confirmed) {
      return;
    }

    await fetch("/api/automations", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id }),
    });

    await loadData();
  }

  return (
    <main className="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-white transition-colors">
      <nav className="flex items-center justify-between px-6 py-4 md:px-12 border-b border-slate-200 dark:border-slate-800">
        <Link
          href="/dashboard"
          className="text-lg font-bold"
        >
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
            <h1 className="text-3xl font-bold">
              Automations
            </h1>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Create automated messages for contacts in your lists.
            </p>
          </div>

          <button
            onClick={() =>
              setShowForm(!showForm)
            }
            className="rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-500"
          >
            {showForm
              ? "Cancel"
              : "+ New Automation"}
          </button>
        </div>

        {showForm && (
          <form
            onSubmit={handleAdd}
            className="mt-6 grid gap-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-6"
          >
            <input
              type="text"
              placeholder="Automation name"
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
              required
              className="rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
            />

            <select
              value={listId}
              onChange={(e) =>
                setListId(e.target.value)
              }
              required
              className="rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-4 py-3 text-slate-900 dark:text-white"
            >
              <option value="">
                Select a contact list...
              </option>

              {lists.map((list) => (
                <option
                  key={list.id}
                  value={list.id}
                >
                  {list.name}
                </option>
              ))}
            </select>

            <textarea
              placeholder="Message to send"
              value={message}
              onChange={(e) =>
                setMessage(e.target.value)
              }
              required
              rows={4}
              className="rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
            />

            {error && (
              <p className="text-red-600 dark:text-red-400 text-sm">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : "Create Automation"}
            </button>
          </form>
        )}

        {runMessage && (
          <div className="mt-6 rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/40 px-4 py-3 text-sm text-blue-700 dark:text-blue-300">
            {runMessage}
          </div>
        )}

        <div className="mt-8">
          {loading ? (
            <p className="text-slate-500 dark:text-slate-400">
              Loading...
            </p>
          ) : automations.length === 0 ? (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-8 text-center text-slate-500 dark:text-slate-400">
              No automations yet. Create your first one above.
            </div>
          ) : (
            <div className="grid gap-3">
              {automations.map(
                (automation) =>
                  editingId ===
                  automation.id ? (
                    <div
                      key={automation.id}
                      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-4"
                    >
                      <input
                        value={editName}
                        onChange={(e) =>
                          setEditName(
                            e.target.value
                          )
                        }
                        className="w-full rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-3 py-2 text-slate-900 dark:text-white mb-3"
                      />

                      <textarea
                        value={editMessage}
                        onChange={(e) =>
                          setEditMessage(
                            e.target.value
                          )
                        }
                        rows={4}
                        className="w-full rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-3 py-2 text-slate-900 dark:text-white mb-3"
                      />

                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            handleEditSave(
                              automation.id
                            )
                          }
                          disabled={editSaving}
                          className="rounded bg-blue-600 px-3 py-1.5 text-white text-sm font-semibold hover:bg-blue-500 disabled:opacity-50"
                        >
                          {editSaving
                            ? "Saving..."
                            : "Save & Go Live"}
                        </button>

                        <button
                          onClick={() =>
                            setEditingId(null)
                          }
                          className="rounded border border-slate-300 dark:border-slate-600 px-3 py-1.5 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      key={automation.id}
                      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold">
                              {automation.name}
                            </p>

                            <span
                              className={`text-xs rounded-full px-2 py-0.5 ${
                                automation.enabled
                                  ? "bg-green-100 dark:bg-green-600/20 text-green-700 dark:text-green-300"
                                  : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                              }`}
                            >
                              {automation.enabled
                                ? "Active"
                                : "Paused"}
                            </span>
                          </div>

                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                            {automation.message}
                          </p>

                          <Link
                            href={`/lists/${automation.list.id}`}
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-2 inline-block"
                          >
                            List:{" "}
                            {automation.list.name}
                          </Link>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap shrink-0">
                          <button
                            onClick={() =>
                              runAutomation(
                                automation
                              )
                            }
                            disabled={
                              runningId ===
                                automation.id ||
                              !automation.enabled
                            }
                            className="rounded bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
                          >
                            {runningId ===
                            automation.id
                              ? "Running..."
                              : "Run Now"}
                          </button>

                          <button
                            onClick={() =>
                              startEdit(
                                automation
                              )
                            }
                            className="rounded border border-slate-300 dark:border-slate-600 px-3 py-1 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            Edit
                          </button>

                          <button
                            onClick={() =>
                              toggleAutomation(
                                automation
                              )
                            }
                            className="rounded border border-slate-300 dark:border-slate-600 px-3 py-1 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            {automation.enabled
                              ? "Pause"
                              : "Activate"}
                          </button>

                          <button
                            onClick={() =>
                              deleteAutomation(
                                automation.id
                              )
                            }
                            className="rounded border border-red-300 dark:border-red-700 px-3 py-1 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950"
                          >
                            Delete
                          </button>
                        </div>
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
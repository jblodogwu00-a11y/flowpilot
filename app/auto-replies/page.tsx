"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import ThemeToggle from "../components/ThemeToggle";
import NavMenu from "../components/NavMenu";

type ContactList = {
  id: string;
  name: string;
};

type AutoReplyRule = {
  id: string;
  channel: "EMAIL" | "WHATSAPP";
  trigger: string;
  reply: string;
  enabled: boolean;
  createdAt: string;
  list: {
    id: string;
    name: string;
  };
};

type RuleForm = {
  channel: "EMAIL" | "WHATSAPP";
  listId: string;
  trigger: string;
  reply: string;
};

const emptyForm: RuleForm = {
  channel: "WHATSAPP",
  listId: "",
  trigger: "",
  reply: "",
};

export default function AutoRepliesPage() {
  const [rules, setRules] = useState<AutoReplyRule[]>([]);
  const [lists, setLists] = useState<ContactList[]>([]);
  const [loading, setLoading] = useState(true);

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<RuleForm>(emptyForm);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<RuleForm>(emptyForm);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [rulesResponse, listsResponse] = await Promise.all([
        fetch("/api/auto-replies"),
        fetch("/api/lists"),
      ]);

      const rulesData = await rulesResponse.json();
      const listsData = await listsResponse.json();

      if (!rulesResponse.ok) {
        throw new Error(
          rulesData?.error || "Failed to load Auto Reply rules"
        );
      }

      if (!listsResponse.ok) {
        throw new Error(
          listsData?.error || "Failed to load contact lists"
        );
      }

      setRules(Array.isArray(rulesData) ? rulesData : []);
      setLists(Array.isArray(listsData) ? listsData : []);

      if (Array.isArray(listsData) && listsData.length > 0) {
        setForm((current) => ({
          ...current,
          listId: current.listId || listsData[0].id,
        }));
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load Auto Reply data"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function updateCreateForm(
    field: keyof RuleForm,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateEditForm(
    field: keyof RuleForm,
    value: string
  ) {
    setEditForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();

    if (!form.listId) {
      setError("Please select a contact list.");
      return;
    }

    if (!form.trigger.trim()) {
      setError("Please enter the message or trigger.");
      return;
    }

    if (!form.reply.trim()) {
      setError("Please enter the automatic reply.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await fetch("/api/auto-replies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "Failed to create Auto Reply"
        );
      }

      setRules((current) => [data, ...current]);

      setForm({
        ...emptyForm,
        listId: lists[0]?.id || "",
      });

      setShowCreate(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create Auto Reply"
      );
    } finally {
      setSaving(false);
    }
  }

  function startEditing(rule: AutoReplyRule) {
    setEditingId(rule.id);

    setEditForm({
      channel: rule.channel,
      listId: rule.list.id,
      trigger: rule.trigger,
      reply: rule.reply,
    });

    setError("");
  }

  function cancelEditing() {
    setEditingId(null);
    setEditForm(emptyForm);
  }

  async function handleSaveEdit(ruleId: string) {
    if (!editForm.listId) {
      setError("Please select a contact list.");
      return;
    }

    if (!editForm.trigger.trim()) {
      setError("Please enter the message or trigger.");
      return;
    }

    if (!editForm.reply.trim()) {
      setError("Please enter the automatic reply.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await fetch("/api/auto-replies", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: ruleId,
          ...editForm,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "Failed to update Auto Reply"
        );
      }

      setRules((current) =>
        current.map((rule) =>
          rule.id === ruleId ? data : rule
        )
      );

      cancelEditing();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update Auto Reply"
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleRule(rule: AutoReplyRule) {
    try {
      setError("");

      const response = await fetch("/api/auto-replies", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: rule.id,
          enabled: !rule.enabled,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "Failed to update Auto Reply"
        );
      }

      setRules((current) =>
        current.map((item) =>
          item.id === rule.id ? data : item
        )
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update Auto Reply"
      );
    }
  }

  async function deleteRule(ruleId: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this Auto Reply rule?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      const response = await fetch("/api/auto-replies", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: ruleId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "Failed to delete Auto Reply"
        );
      }

      setRules((current) =>
        current.filter((rule) => rule.id !== ruleId)
      );

      if (editingId === ruleId) {
        cancelEditing();
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete Auto Reply"
      );
    }
  }

  function channelLabel(channel: AutoReplyRule["channel"]) {
    return channel === "WHATSAPP" ? "WhatsApp" : "Email";
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white">
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <Link
              href="/dashboard"
              className="text-xl font-bold tracking-tight"
            >
              FlowPilot
            </Link>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Auto Replies
            </p>
          </div>

          <div className="flex items-center gap-3">
            <NavMenu />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Auto Replies
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
              Create automatic replies for common messages from
              leads through Email and WhatsApp.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setShowCreate((current) => !current);
              setError("");
            }}
            className="rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
          >
            {showCreate ? "Close" : "+ Create Auto Reply"}
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
            {error}
          </div>
        )}

        {showCreate && (
          <form
            onSubmit={handleCreate}
            className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="mb-6">
              <h2 className="text-xl font-semibold">
                Create Auto Reply
              </h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Tell FlowPilot what message to look for and what
                reply to send.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Channel
                </label>

                <select
                  value={form.channel}
                  onChange={(event) =>
                    updateCreateForm(
                      "channel",
                      event.target.value
                    )
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500 dark:border-slate-700 dark:bg-slate-950"
                >
                  <option value="WHATSAPP">WhatsApp</option>
                  <option value="EMAIL">Email</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Contact List
                </label>

                <select
                  value={form.listId}
                  onChange={(event) =>
                    updateCreateForm(
                      "listId",
                      event.target.value
                    )
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500 dark:border-slate-700 dark:bg-slate-950"
                >
                  <option value="">
                    Select a contact list
                  </option>

                  {lists.map((list) => (
                    <option key={list.id} value={list.id}>
                      {list.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium">
                  When the lead says
                </label>

                <textarea
                  value={form.trigger}
                  onChange={(event) =>
                    updateCreateForm(
                      "trigger",
                      event.target.value
                    )
                  }
                  rows={3}
                  placeholder="Example: Is the course suitable for beginners?"
                  className="w-full resize-y rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500 dark:border-slate-700 dark:bg-slate-950"
                />

                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  Enter the common message or question you want
                  FlowPilot to recognize.
                </p>
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium">
                  FlowPilot should reply
                </label>

                <textarea
                  value={form.reply}
                  onChange={(event) =>
                    updateCreateForm(
                      "reply",
                      event.target.value
                    )
                  }
                  rows={5}
                  placeholder="Example: Yes, {first name}. The course is designed to help beginners..."
                  className="w-full resize-y rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500 dark:border-slate-700 dark:bg-slate-950"
                />

                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  You can use {"{first name}"} in the reply for
                  personalization. The personalization engine will
                  be connected later.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={saving || lists.length === 0}
                className="rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
              >
                {saving ? "Saving..." : "Save Auto Reply"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowCreate(false);
                  setError("");
                }}
                className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
            </div>

            {lists.length === 0 && (
              <p className="mt-4 text-sm text-amber-600 dark:text-amber-400">
                Create a contact list first before creating an
                Auto Reply rule.
              </p>
            )}
          </form>
        )}

        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">
              Your Auto Reply Rules
            </h2>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {rules.length}{" "}
              {rules.length === 1 ? "rule" : "rules"} configured
            </p>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
            Loading Auto Reply rules...
          </div>
        ) : rules.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
            <div className="mx-auto max-w-lg">
              <div className="mb-4 text-4xl">↩️</div>

              <h3 className="text-lg font-semibold">
                No Auto Reply rules yet
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                Create your first rule to automatically respond
                to common questions and messages from your leads.
              </p>

              <button
                type="button"
                onClick={() => setShowCreate(true)}
                className="mt-5 rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white dark:bg-white dark:text-slate-900"
              >
                Create Your First Auto Reply
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                {editingId === rule.id ? (
                  <div>
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold">
                        Edit Auto Reply
                      </h3>
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-medium">
                          Channel
                        </label>

                        <select
                          value={editForm.channel}
                          onChange={(event) =>
                            updateEditForm(
                              "channel",
                              event.target.value
                            )
                          }
                          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-950"
                        >
                          <option value="WHATSAPP">
                            WhatsApp
                          </option>
                          <option value="EMAIL">Email</option>
                        </select>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium">
                          Contact List
                        </label>

                        <select
                          value={editForm.listId}
                          onChange={(event) =>
                            updateEditForm(
                              "listId",
                              event.target.value
                            )
                          }
                          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-950"
                        >
                          {lists.map((list) => (
                            <option
                              key={list.id}
                              value={list.id}
                            >
                              {list.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <label className="mb-2 block text-sm font-medium">
                          When the lead says
                        </label>

                        <textarea
                          value={editForm.trigger}
                          onChange={(event) =>
                            updateEditForm(
                              "trigger",
                              event.target.value
                            )
                          }
                          rows={3}
                          className="w-full resize-y rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-950"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="mb-2 block text-sm font-medium">
                          FlowPilot should reply
                        </label>

                        <textarea
                          value={editForm.reply}
                          onChange={(event) =>
                            updateEditForm(
                              "reply",
                              event.target.value
                            )
                          }
                          rows={5}
                          className="w-full resize-y rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-950"
                        />
                      </div>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          handleSaveEdit(rule.id)
                        }
                        disabled={saving}
                        className="rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50 dark:bg-white dark:text-slate-900"
                      >
                        {saving ? "Saving..." : "Save Changes"}
                      </button>

                      <button
                        type="button"
                        onClick={cancelEditing}
                        className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold dark:border-slate-700"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0">
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            {channelLabel(rule.channel)}
                          </span>

                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            {rule.list.name}
                          </span>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              rule.enabled
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                                : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                            }`}
                          >
                            {rule.enabled
                              ? "Active"
                              : "Inactive"}
                          </span>
                        </div>

                        <h3 className="text-lg font-semibold">
                          Auto Reply Rule
                        </h3>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => toggleRule(rule)}
                          className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                            rule.enabled
                              ? "border border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-950/30"
                              : "border border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
                          }`}
                        >
                          {rule.enabled
                            ? "Deactivate"
                            : "Activate"}
                        </button>

                        <button
                          type="button"
                          onClick={() => startEditing(rule)}
                          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteRule(rule.id)}
                          className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/30"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    <div className="mt-6 grid gap-5 md:grid-cols-2">
                      <div className="rounded-xl bg-slate-50 p-5 dark:bg-slate-950">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          When the lead says
                        </p>

                        <p className="whitespace-pre-wrap text-sm leading-6">
                          {rule.trigger}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-5 dark:bg-slate-950">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          FlowPilot replies
                        </p>

                        <p className="whitespace-pre-wrap text-sm leading-6">
                          {rule.reply}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
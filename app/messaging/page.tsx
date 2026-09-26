"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import ThemeToggle from "../components/ThemeToggle";
import NavMenu from "../components/NavMenu";

type Contact = {
  id: string;
  name: string;
  email: string | null;
};

export default function MessagingPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactId, setContactId] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadContacts() {
      try {
        const response = await fetch("/api/contacts");

        if (!response.ok) {
          throw new Error("Failed to load contacts");
        }

        const data = await response.json();

        setContacts(Array.isArray(data) ? data : data.contacts || []);
      } catch (error) {
        console.error(error);
        setResult("Failed to load contacts.");
      } finally {
        setLoading(false);
      }
    }

    loadContacts();
  }, []);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.target.files || []);

    if (selectedFiles.length > 0) {
      setAttachments((current) => [...current, ...selectedFiles]);
    }

    event.target.value = "";
  }

  function removeAttachment(index: number) {
    setAttachments((current) =>
      current.filter((_, fileIndex) => fileIndex !== index)
    );
  }

  function formatFileSize(bytes: number) {
    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    if (bytes < 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!contactId) {
      setResult("Please select a contact.");
      return;
    }

    if (!subject.trim()) {
      setResult("Please enter a subject.");
      return;
    }

    if (!message.trim()) {
      setResult("Please enter a message.");
      return;
    }

    setSending(true);
    setResult("");

    try {
      const formData = new FormData();

      formData.append("contactId", contactId);
      formData.append("subject", subject);
      formData.append("message", message);

      attachments.forEach((file) => {
        formData.append("attachments", file);
      });

      const response = await fetch("/api/send-message", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send message");
      }

      setResult(
        attachments.length > 0
          ? `Message and ${attachments.length} attachment${
              attachments.length === 1 ? "" : "s"
            } sent successfully.`
          : "Message sent successfully."
      );

      setSubject("");
      setMessage("");
      setAttachments([]);
    } catch (error) {
      setResult(
        error instanceof Error
          ? error.message
          : "Failed to send message."
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-white">
      <header className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <Link
              href="/dashboard"
              className="text-xl font-bold tracking-tight"
            >
              FlowPilot
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <NavMenu />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Messaging</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Send a one-off email directly to a contact.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium">
                Contact
              </label>

              <select
                value={contactId}
                onChange={(event) => setContactId(event.target.value)}
                disabled={loading || sending}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-black dark:border-gray-700 dark:bg-gray-950 dark:focus:border-white"
              >
                <option value="">
                  {loading ? "Loading contacts..." : "Select a contact"}
                </option>

                {contacts
                  .filter((contact) => contact.email)
                  .map((contact) => (
                    <option key={contact.id} value={contact.id}>
                      {contact.name} — {contact.email}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Subject
              </label>

              <input
                type="text"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                disabled={sending}
                placeholder="Enter email subject"
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-black dark:border-gray-700 dark:bg-gray-950 dark:focus:border-white"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Message
              </label>

              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                disabled={sending}
                placeholder="Write your message..."
                rows={10}
                className="w-full resize-y rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-black dark:border-gray-700 dark:bg-gray-950 dark:focus:border-white"
              />
            </div>

            <div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={sending}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-medium transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-950 dark:hover:bg-gray-800"
              >
                <span className="text-lg">📎</span>
                Attach File
              </button>

              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                You can select one or multiple files.
              </p>

              {attachments.length > 0 && (
                <div className="mt-4 space-y-2">
                  {attachments.map((file, index) => (
                    <div
                      key={`${file.name}-${index}`}
                      className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-950"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {file.name}
                        </p>

                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatFileSize(file.size)}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        disabled={sending}
                        className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-950"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={sending || loading}
              className="rounded-xl bg-black px-6 py-3 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black"
            >
              {sending ? "Sending..." : "Send Message"}
            </button>

            {result && (
              <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm dark:border-gray-700 dark:bg-gray-950">
                {result}
              </div>
            )}
          </form>
        </div>
      </section>
    </main>
  );
}
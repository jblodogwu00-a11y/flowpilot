"use client";

import { FormEvent, useState } from "react";

export default function WhatsAppTestPage() {
  const [to, setTo] = useState("");
  const [message, setMessage] = useState(
    "Hello! This is a test message from FlowPilot."
  );
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setStatus("");

    try {
      const response = await fetch("/api/whatsapp/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to,
          message,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setStatus(
          `Error: ${data?.error || "Unable to send WhatsApp message."}`
        );
        return;
      }

      setStatus(
        `Success! WhatsApp message sent. Message ID: ${
          data.messageId || "received"
        }`
      );
    } catch (error) {
      console.error(error);
      setStatus("Error: Could not connect to FlowPilot.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-xl rounded-2xl bg-white p-6 shadow">
        <h1 className="text-2xl font-bold text-gray-900">
          WhatsApp API Test
        </h1>

        <p className="mt-2 text-sm text-gray-600">
          Send a test WhatsApp message through your connected FlowPilot
          WhatsApp API.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label
              htmlFor="to"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Recipient WhatsApp number
            </label>

            <input
              id="to"
              type="tel"
              value={to}
              onChange={(event) => setTo(event.target.value)}
              placeholder="2348012345678"
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-gray-500"
            />

            <p className="mt-1 text-xs text-gray-500">
              Enter the number in international format without the + sign.
            </p>
          </div>

          <div>
            <label
              htmlFor="message"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Message
            </label>

            <textarea
              id="message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={5}
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-gray-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-black px-4 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send WhatsApp Test"}
          </button>
        </form>

        {status && (
          <div className="mt-5 rounded-lg bg-gray-100 p-4 text-sm text-gray-800">
            {status}
          </div>
        )}
      </div>
    </main>
  );
}
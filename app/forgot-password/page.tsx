"use client";

import { useState } from "react";
import Link from "next/link";
import ThemeToggle from "../components/ThemeToggle";

export default function ForgotPassword() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white text-slate-900 dark:bg-slate-950 dark:text-white px-6 transition-colors">
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>

      <h1 className="text-3xl font-bold">Reset your password</h1>
      <p className="mt-2 max-w-sm text-center text-slate-500 dark:text-slate-400">
        Enter the email linked to your account and we will send you a link
        to reset your password.
      </p>

      {submitted ? (
        <div className="mt-8 w-full max-w-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-6 text-center">
          <p className="text-slate-600 dark:text-slate-300">
            If an account exists for that email, a reset link is on its way.
          </p>
          <Link href="/login" className="mt-4 inline-block text-blue-600 dark:text-blue-400 hover:underline">
            Back to Log In
          </Link>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitted(true);
          }}
          className="mt-8 flex w-full max-w-sm flex-col gap-4"
        >
          <input
            type="email"
            required
            placeholder="Email address"
            className="rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
          />
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-500"
          >
            Send Reset Link
          </button>
          <Link href="/login" className="text-center text-sm text-slate-500 dark:text-slate-400 hover:underline">
            Back to Log In
          </Link>
        </form>
      )}
    </main>
  );
}
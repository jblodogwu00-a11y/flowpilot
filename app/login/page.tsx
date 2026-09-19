"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";

export default function LogIn() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-white px-6">
      <h1 className="text-3xl font-bold">Log in to FlowPilot</h1>
      <p className="mt-2 text-slate-400">Welcome back.</p>

      <div className="mt-8 flex w-full max-w-sm flex-col gap-4">
        <button
          onClick={() => signIn("google", { callbackUrl: "/" })}
          className="flex items-center justify-center gap-3 rounded-lg bg-white text-slate-900 px-6 py-3 font-semibold hover:bg-slate-100"
        >
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l6-6C34.5 5.5 29.5 3.5 24 3.5 12.7 3.5 3.5 12.7 3.5 24S12.7 44.5 24 44.5 44.5 35.3 44.5 24c0-1.2-.1-2.4-.3-3.5z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.9 18.9 13 24 13c3.1 0 5.8 1.1 8 3l6-6C34.5 5.5 29.5 3.5 24 3.5c-7.7 0-14.3 4.4-17.7 10.9z"/>
            <path fill="#4CAF50" d="M24 44.5c5.4 0 10.3-1.8 14.1-5.1l-6.5-5.5c-2.1 1.5-4.8 2.4-7.6 2.4-5.3 0-9.7-3.1-11.3-7.6l-6.6 5.1C9.6 40 16.3 44.5 24 44.5z"/>
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.7l6.5 5.5C41.2 36.1 44.5 30.6 44.5 24c0-1.2-.1-2.4-.9-3.5z"/>
          </svg>
          Continue with Google
        </button>

        <div className="text-center text-slate-500 text-sm">or</div>

        <form className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email address"
            className="rounded-lg bg-slate-900 border border-slate-700 px-4 py-3 text-white placeholder-slate-500"
          />

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              className="w-full rounded-lg bg-slate-900 border border-slate-700 px-4 py-3 pr-12 text-white placeholder-slate-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              {showPassword ? (
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                </svg>
              ) : (
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>

          <div className="text-right">
            <Link href="/forgot-password" className="text-sm text-blue-400 hover:underline">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-500"
          >
            Log In
          </button>
        </form>
      </div>
    </main>
  );
}
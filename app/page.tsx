"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import ThemeToggle from "./components/ThemeToggle";

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <main className="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-white transition-colors">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 md:px-12">
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="FlowPilot" width={40} height={40} />
          <span className="text-xl font-bold">FlowPilot</span>
        </div>

        <div className="hidden md:flex items-center gap-4">
          <ThemeToggle />
          <Link href="/login" className="px-4 py-2 font-semibold hover:text-blue-500 dark:hover:text-blue-400">
            Log In
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-500"
          >
            Get Started
          </Link>
        </div>

        <div className="flex items-center gap-3 md:hidden">
          <ThemeToggle />
          <button
            className="flex flex-col gap-1.5"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <span className="block h-0.5 w-6 bg-slate-900 dark:bg-white"></span>
            <span className="block h-0.5 w-6 bg-slate-900 dark:bg-white"></span>
            <span className="block h-0.5 w-6 bg-slate-900 dark:bg-white"></span>
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div className="flex flex-col gap-2 px-6 pb-4 md:hidden">
          <Link href="/login" className="rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-3 text-center font-semibold">
            Log In
          </Link>
          <Link href="/signup" className="rounded-lg bg-blue-600 px-4 py-3 text-center font-semibold text-white">
            Get Started
          </Link>
        </div>
      )}

      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center px-6 py-20 md:py-32">
        <h1 className="text-5xl md:text-7xl font-extrabold leading-tight">FlowPilot</h1>
        <p className="mt-4 text-xl md:text-2xl text-slate-500 dark:text-slate-400">Marketing Automation Made Simple</p>
        <p className="mt-8 max-w-2xl text-lg md:text-xl text-slate-600 dark:text-slate-300">
          Manage contacts, automate emails, SMS, and WhatsApp — all in one free platform.
          Built for small businesses and solo founders who need enterprise-grade tools
          without the enterprise price tag.
        </p>
        <div className="mt-10 flex gap-4">
          <Link href="/signup" className="rounded-lg bg-blue-600 px-8 py-4 text-lg font-semibold text-white hover:bg-blue-500">
            Get Started
          </Link>
          <Link href="/login" className="rounded-lg border border-slate-300 dark:border-slate-600 px-8 py-4 text-lg font-semibold hover:bg-slate-100 dark:hover:bg-slate-800">
            Log In
          </Link>
        </div>
      </section>

      {/* Problem/Solution */}
      <section className="px-6 py-20 md:px-12 bg-slate-50 dark:bg-slate-900/30">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold">
            Running a business shouldn&apos;t mean juggling five different apps
          </h2>
          <p className="mt-6 text-lg text-slate-600 dark:text-slate-300">
            Most businesses cobble together a CRM for contacts, one tool for email,
            another for SMS, a separate app for WhatsApp, and spreadsheets to track
            it all. FlowPilot replaces that entire stack with one connected platform —
            so your contacts, conversations, and campaigns finally live in one place.
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-20 md:px-12">
        <h2 className="text-center text-3xl md:text-4xl font-bold">
          Everything you need to grow, in one place
        </h2>
        <p className="mt-4 text-center text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
          FlowPilot brings your contacts, campaigns, and conversations together —
          no more juggling five different tools.
        </p>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-8">
            <h3 className="text-xl font-bold">Contact Management</h3>
            <p className="mt-3 text-slate-500 dark:text-slate-400">
              Organize every lead and customer in one place. Tag, segment, and
              track every interaction automatically, so you always know who
              you&apos;re talking to and where they stand.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-8">
            <h3 className="text-xl font-bold">Automated Campaigns</h3>
            <p className="mt-3 text-slate-500 dark:text-slate-400">
              Build automations that send the right email, SMS, or WhatsApp
              message at exactly the right moment — a welcome message, a
              follow-up, a re-engagement nudge — all without manual work.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-8">
            <h3 className="text-xl font-bold">Smart Auto-Replies</h3>
            <p className="mt-3 text-slate-500 dark:text-slate-400">
              Respond to incoming messages instantly, whether with a quick
              fixed reply for common questions or an AI-generated response
              tailored to what the customer actually asked.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-8">
            <h3 className="text-xl font-bold">Multi-Channel Messaging</h3>
            <p className="mt-3 text-slate-500 dark:text-slate-400">
              Reach people where they actually check messages — email, SMS,
              and WhatsApp — from a single inbox and a single automation
              builder.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-8">
            <h3 className="text-xl font-bold">Simple Landing Pages</h3>
            <p className="mt-3 text-slate-500 dark:text-slate-400">
              Capture leads with forms and pages that feed straight into your
              contact list and automations — no separate page builder needed.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-8">
            <h3 className="text-xl font-bold">Built-In Analytics</h3>
            <p className="mt-3 text-slate-500 dark:text-slate-400">
              See what&apos;s working — open rates, reply rates, and campaign
              performance — without exporting anything to a spreadsheet.
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-20 md:px-12 bg-slate-50 dark:bg-slate-900/30">
        <h2 className="text-center text-3xl md:text-4xl font-bold">How it works</h2>
        <div className="mt-16 grid gap-10 md:grid-cols-3 max-w-5xl mx-auto">
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-xl font-bold text-white">1</div>
            <h3 className="mt-4 text-lg font-bold">Add your contacts</h3>
            <p className="mt-2 text-slate-500 dark:text-slate-400">
              Import your existing list or capture new leads through a
              FlowPilot form.
            </p>
          </div>
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-xl font-bold text-white">2</div>
            <h3 className="mt-4 text-lg font-bold">Build an automation</h3>
            <p className="mt-2 text-slate-500 dark:text-slate-400">
              Set a trigger — a form submission, a tag, a reply — and decide
              what happens next.
            </p>
          </div>
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-xl font-bold text-white">3</div>
            <h3 className="mt-4 text-lg font-bold">Let it run</h3>
            <p className="mt-2 text-slate-500 dark:text-slate-400">
              FlowPilot sends the right message at the right time, every
              time, while you focus on the rest of your business.
            </p>
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section className="px-6 py-20 md:px-12">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold">Built for growing businesses</h2>
          <p className="mt-6 text-lg text-slate-600 dark:text-slate-300">
            Whether you&apos;re a solo founder, a small team, or a local business
            owner, FlowPilot gives you the same marketing automation power
            used by big companies — without the complexity or the cost.
            No credit card required to get started, and no hidden paywalls.
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 py-20 md:px-12 bg-slate-50 dark:bg-slate-900/30 text-center">
        <h2 className="text-3xl md:text-4xl font-bold">Ready to simplify your marketing?</h2>
        <p className="mt-4 text-slate-500 dark:text-slate-400">Join FlowPilot free — no credit card needed.</p>
        <div className="mt-8 flex justify-center gap-4">
          <Link href="/signup" className="rounded-lg bg-blue-600 px-8 py-4 text-lg font-semibold text-white hover:bg-blue-500">
            Get Started Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 px-6 py-10 text-center text-slate-500 md:px-12">
        <p>© {new Date().getFullYear()} FlowPilot. Marketing Automation Made Simple.</p>
      </footer>
    </main>
  );
}
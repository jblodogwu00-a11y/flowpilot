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
        <div className="mt-10
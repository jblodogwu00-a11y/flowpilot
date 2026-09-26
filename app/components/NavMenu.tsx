"use client";

import { useState } from "react";
import Link from "next/link";

export default function NavMenu() {
const [open, setOpen] = useState(false);

return ( <div className="relative">
<button
type="button"
onClick={() => setOpen(!open)}
aria-label="Menu"
className="flex h-9 w-9 flex-col items-center justify-center gap-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
> <span className="block h-0.5 w-4 bg-slate-900 dark:bg-white" /> <span className="block h-0.5 w-4 bg-slate-900 dark:bg-white" /> <span className="block h-0.5 w-4 bg-slate-900 dark:bg-white" /> </button>

```
  {open && (
    <>
      <div
        className="fixed inset-0 z-10"
        onClick={() => setOpen(false)}
      />

      <div className="absolute right-0 z-20 mt-2 w-48 rounded-lg border border-slate-200 bg-white py-2 shadow-lg dark:border-slate-700 dark:bg-slate-900">
        <Link
          href="/dashboard"
          onClick={() => setOpen(false)}
          className="block px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          Dashboard
        </Link>

        <Link
          href="/contacts"
          onClick={() => setOpen(false)}
          className="block px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          Contacts
        </Link>

        <Link
          href="/lists"
          onClick={() => setOpen(false)}
          className="block px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          Contact Lists
        </Link>

        <Link
          href="/automations"
          onClick={() => setOpen(false)}
          className="block px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          Automations
        </Link>

        <Link
          href="/messaging"
          onClick={() => setOpen(false)}
          className="block px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          Messaging
        </Link>
      </div>
    </>
  )}
</div>

);
}

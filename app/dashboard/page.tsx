import { auth } from "../../../auth";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import ThemeToggle from "../components/ThemeToggle";
import NavMenu from "../components/NavMenu";

export default async function Dashboard() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-white transition-colors">
      <nav className="flex items-center justify-between px-6 py-4 md:px-12 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="FlowPilot" width={36} height={36} />
          <span className="text-lg font-bold">FlowPilot</span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          {session.user?.image && (
            <img
              src={session.user.image}
              alt="Profile"
              className="h-9 w-9 rounded-full"
            />
          )}
          <span className="text-sm text-slate-600 dark:text-slate-300 hidden sm:inline">{session.user?.name}</span>
          <NavMenu />
        </div>
      </nav>

      <section className="px-6 py-12 md:px-12">
        <h1 className="text-3xl font-bold">
          Welcome back{session.user?.name ? `, ${session.user.name.split(" ")[0]}` : ""}
        </h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400">
          Here is what is happening with your FlowPilot account.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <Link href="/contacts" className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-6 hover:border-blue-600 transition">
            <p className="text-sm text-slate-500 dark:text-slate-400">Contacts</p>
            <p className="mt-2 text-3xl font-bold">0</p>
          </Link>
          <Link href="/lists" className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-6 hover:border-blue-600 transition">
            <p className="text-sm text-slate-500 dark:text-slate-400">Contact Lists</p>
            <p className="mt-2 text-3xl font-bold">0</p>
          </Link>
          <Link href="/automations" className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-6 hover:border-blue-600 transition">
            <p className="text-sm text-slate-500 dark:text-slate-400">Automations</p>
            <p className="mt-2 text-3xl font-bold">0</p>
          </Link>
        </div>

        <div className="mt-12 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-8 text-center">
          <p className="text-slate-500 dark:text-slate-400">
            Your contacts list is empty. Add your first contact to get started.
          </p>
        </div>
      </section>
    </main>
  );
}
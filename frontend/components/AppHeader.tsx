"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "@/context/AuthContext";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/participants", label: "Participants" },
] as const;

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
        <nav className="flex items-center gap-1">
          <span className="mr-4 text-sm font-semibold tracking-tight">
            Clinical Trial Dashboard
          </span>
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              aria-current={pathname.startsWith(href) ? "page" : undefined}
              className={`rounded-md px-3 py-1.5 text-sm ${
                pathname.startsWith(href)
                  ? "bg-zinc-100 font-medium text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          {user && <span className="text-sm text-zinc-500">{user.username}</span>}
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}

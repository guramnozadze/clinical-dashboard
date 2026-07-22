"use client";

import { useRouter } from "next/navigation";

import { useAuth } from "@/context/AuthContext";

// Placeholder: the metrics dashboard lands in step 9. This exists so the
// login redirect has a real target and the auth loop can be exercised.
export default function DashboardPage() {
  const router = useRouter();
  const { user, logout, isLoading } = useAuth();

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <main className="flex-1 p-8">
      <div className="mx-auto flex max-w-4xl items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {isLoading
              ? "Checking session..."
              : user
                ? `Signed in as ${user.username}`
                : "Not signed in"}
          </p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Sign out
        </button>
      </div>
    </main>
  );
}

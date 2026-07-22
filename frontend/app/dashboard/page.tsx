"use client";

import { AppHeader } from "@/components/AppHeader";

// Placeholder: the metrics dashboard lands in step 9.
export default function DashboardPage() {
  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Trial metrics arrive in step 9.
        </p>
      </main>
    </>
  );
}

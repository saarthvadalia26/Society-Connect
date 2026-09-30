"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[RootError]", error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-12 text-center bg-slate-50 dark:bg-slate-950 transition-colors">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-2xl font-bold text-red-700 dark:bg-red-900/30 dark:text-red-400 mb-6 shadow-md">
        !
      </div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
        Something went wrong
      </h1>
      <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
        An unexpected error occurred. You can retry the action or return to the dashboard.
      </p>
      <div className="mt-6 flex items-center justify-center gap-3">
        <Button variant="primary" onClick={() => reset()}>
          Try again
        </Button>
        <Button variant="secondary" onClick={() => (window.location.href = "/")}>
          Go to home
        </Button>
      </div>
    </main>
  );
}

"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { deleteSocietyAction } from "@/lib/actions";

function InnerButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 active:scale-[0.98] disabled:opacity-60 disabled:cursor-wait"
    >
      {pending ? (
        <span className="flex items-center gap-2">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          Deleting...
        </span>
      ) : (
        "Yes, delete everything"
      )}
    </button>
  );
}

export function DeleteSocietyButton() {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="shrink-0 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-600 shadow-sm transition hover:bg-red-50 dark:border-red-800 dark:bg-slate-800 dark:text-red-400 dark:hover:bg-red-900/20"
      >
        Delete society
      </button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <p className="text-xs font-semibold text-red-700 dark:text-red-400">
        Are you sure? This will permanently delete everything.
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => setConfirming(false)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
        >
          Cancel
        </button>
        <form action={deleteSocietyAction}>
          <InnerButton />
        </form>
      </div>
    </div>
  );
}

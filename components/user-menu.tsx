"use client";

import { useState, useRef, useEffect } from "react";
import { signOutAction, deleteSocietyAction } from "@/lib/actions";
import type { User } from "@/lib/types";
import { Badge } from "./ui";

function ThemeToggleItem() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("sc-theme", next ? "dark" : "light");
  }

  return (
    <button
      onClick={toggle}
      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
    >
      <span>{dark ? "Light mode" : "Dark mode"}</span>
      {dark ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" /></svg>
      )}
    </button>
  );
}

export function UserMenu({ user }: { user: User }) {
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setConfirmDelete(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => { setOpen(!open); setConfirmDelete(false); }}
        className="flex w-full items-center gap-3 rounded-lg px-2 py-2 transition hover:bg-slate-50 dark:hover:bg-slate-800"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700 dark:bg-brand-900/40 dark:text-brand-400">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1 text-left">
          <div className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{user.name}</div>
          <div className="truncate text-[11px] text-slate-500 dark:text-slate-400">{user.email}</div>
        </div>
        <Badge tone={user.role === "admin" ? "blue" : user.role === "guard" ? "amber" : "slate"}>
          {user.role === "admin" ? "secretary" : user.role}
        </Badge>
      </button>

      {open ? (
        <div className="absolute bottom-full left-0 right-0 mb-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
          <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-700">
            <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{user.name}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">{user.email}</div>
            <div className="mt-1">
              <Badge tone={user.role === "admin" ? "blue" : user.role === "guard" ? "amber" : "slate"}>
                {user.role === "admin" ? "secretary" : user.role}
              </Badge>
            </div>
          </div>

          <div className="p-1.5">
            <ThemeToggleItem />

            <form action={signOutAction}>
              <button
                type="submit"
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" /></svg>
                Sign out
              </button>
            </form>

            {user.role === "admin" ? (
              <>
                <div className="my-1 border-t border-slate-100 dark:border-slate-700" />
                {!confirmDelete ? (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
                    Delete society
                  </button>
                ) : (
                  <div className="px-3 py-2">
                    <p className="mb-2 text-xs font-semibold text-red-700 dark:text-red-400">Delete everything permanently?</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setConfirmDelete(false)}
                        className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={async () => {
                          setDeleting(true);
                          await deleteSocietyAction();
                        }}
                        disabled={deleting}
                        className="flex-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                      >
                        {deleting ? "Deleting..." : "Yes, delete"}
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

"use client";

import { useState, useRef, useEffect } from "react";
import { signOutAction } from "@/lib/actions";
import type { User } from "@/lib/types";
import { Badge } from "./ui";
import { DeleteSocietyModal } from "./delete-society-modal";

export function UserMenu({ user }: { user: User }) {
  const [open, setOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <>
      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen(!open)}
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
                  <button
                    onClick={() => {
                      setOpen(false);
                      setShowDeleteModal(true);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
                    Delete society
                  </button>
                </>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      {user.role === "admin" ? (
        <DeleteSocietyModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          societyName={user.society_name || "Society"}
        />
      ) : null}
    </>
  );
}

"use client";

import { useState, useTransition } from "react";
import { deleteSocietyAction } from "@/lib/actions";
import { PasswordInput } from "@/components/password-input";
import { Input, Label } from "@/components/ui";

interface DeleteSocietyModalProps {
  isOpen: boolean;
  onClose: () => void;
  societyName: string;
}

export function DeleteSocietyModal({
  isOpen,
  onClose,
  societyName,
}: DeleteSocietyModalProps) {
  const [password, setPassword] = useState("");
  const [confirmName, setConfirmName] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  const nameMatches = confirmName.trim().toLowerCase() === societyName.trim().toLowerCase();
  const canSubmit = password.length > 0 && nameMatches && !isPending;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!password) {
      setError("Please enter your admin password to authenticate.");
      return;
    }

    if (!nameMatches) {
      setError(`Please type the society name exactly: "${societyName}".`);
      return;
    }

    const formData = new FormData();
    formData.append("password", password);
    formData.append("confirmName", confirmName);

    startTransition(async () => {
      try {
        const result = await deleteSocietyAction(formData);
        if (result?.error) {
          setError(result.error);
        }
      } catch (err: any) {
        // Next.js redirect throws NEXT_REDIRECT which is caught automatically
        if (err?.message && !err.message.includes("NEXT_REDIRECT")) {
          setError(err.message);
        }
      }
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-society-title"
    >
      <div
        className="relative w-full max-w-lg rounded-2xl border border-red-200 bg-white p-6 shadow-2xl dark:border-red-900/40 dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Icon + Title */}
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <h2
              id="delete-society-title"
              className="text-lg font-bold text-slate-900 dark:text-slate-100"
            >
              Delete Society Permanently
            </h2>
            <p className="mt-1 text-xs text-red-600 dark:text-red-400 font-semibold uppercase tracking-wider">
              Danger Zone — Irreversible Action
            </p>
          </div>
        </div>

        {/* Warning Details Card */}
        <div className="mt-4 rounded-xl border border-red-100 bg-red-50/70 p-4 dark:border-red-900/30 dark:bg-red-950/20">
          <p className="text-xs font-semibold text-red-800 dark:text-red-300">
            This will immediately and permanently erase all records for{" "}
            <span className="underline font-bold">{societyName}</span>:
          </p>
          <ul className="mt-2 space-y-1.5 text-xs text-red-700 dark:text-red-400">
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
              All resident, guard, and admin accounts & login credentials
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
              All flats, maintenance bills, and accounting ledgers
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
              All notices, complaints, facility bookings, and gate logs
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
              The entire society database profile and settings
            </li>
          </ul>
        </div>

        {/* Form with Authentication */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Admin Password Field */}
          <div>
            <Label htmlFor="admin-auth-password">
              Admin Password{" "}
              <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                (Authentication required)
              </span>
            </Label>
            <PasswordInput
              id="admin-auth-password"
              name="password"
              placeholder="Enter your admin login password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isPending}
              required
              autoComplete="current-password"
              className="mt-1"
            />
          </div>

          {/* Confirm Society Name */}
          <div>
            <Label htmlFor="confirm-society-name">
              Confirm Society Name
            </Label>
            <p className="mb-1 text-xs text-slate-500 dark:text-slate-400">
              Type <strong className="text-slate-800 dark:text-slate-200 select-all font-mono">{societyName}</strong> to confirm:
            </p>
            <Input
              id="confirm-society-name"
              name="confirmName"
              placeholder={societyName}
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              disabled={isPending}
              required
              autoComplete="off"
            />
          </div>

          {/* Error Message Box */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300 flex items-start gap-2">
              <svg
                className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400 mt-0.5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Modal Actions */}
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  <span>Verifying & Deleting...</span>
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                  </svg>
                  <span>Authorize & Delete Society</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

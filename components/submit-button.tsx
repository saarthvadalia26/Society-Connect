"use client";

import { useFormStatus } from "react-dom";
import { cn } from "@/lib/cn";

export function SubmitButton({
  children,
  loadingText,
  className,
  variant = "primary",
}: {
  children: React.ReactNode;
  loadingText: string;
  successText?: string;
  className?: string;
  variant?: "primary" | "danger";
}) {
  const { pending } = useFormStatus();

  const base = variant === "danger"
    ? "bg-red-600 hover:bg-red-700 shadow-sm"
    : "relative overflow-hidden bg-brand-600 shadow-md hover:shadow-lg hover:bg-brand-700 hover:-translate-y-[1px]";

  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        "group inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all active:scale-[0.98]",
        pending ? "opacity-70 cursor-wait" : base,
        className,
      )}
    >
      {/* Subtle Shimmer Effect Loop */}
      {!pending && variant !== "danger" && (
        <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      )}
      {pending ? (
        <>
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </button>
  );
}

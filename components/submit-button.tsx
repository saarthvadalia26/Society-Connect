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
    : "bg-gradient-to-r from-brand-600 to-blue-700 shadow-md hover:shadow-lg hover:from-brand-700 hover:to-blue-800";

  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        "inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all active:scale-[0.98]",
        pending ? "opacity-70 cursor-wait" : base,
        className,
      )}
    >
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

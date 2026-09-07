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

  const baseColor = variant === "danger"
    ? "bg-red-600"
    : "bg-brand-600";

  const interactive = variant === "danger"
    ? "hover:bg-red-700 shadow-sm hover:shadow active:scale-[0.98]"
    : "hover:bg-brand-700 shadow-md hover:shadow-lg hover:-translate-y-[0.5px] active:scale-[0.98]";

  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        "group relative overflow-hidden inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all",
        baseColor,
        pending ? "opacity-85 cursor-wait" : interactive,
        className,
      )}
    >
      {/* Subtle Shimmer Effect Loop — soft matte reflection */}
      {!pending && variant !== "danger" && (
        <div className="pointer-events-none absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      )}
      {pending ? (
        <span className="inline-flex items-center justify-center gap-2">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          <span>{loadingText}</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
}

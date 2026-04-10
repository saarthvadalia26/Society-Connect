import type { ButtonHTMLAttributes, HTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Card({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-slate-700/80 dark:bg-slate-800", className)} {...rest}>
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-4 dark:border-slate-700">
      <div>
        <h2 className="text-[15px] font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
        {subtitle ? <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function CardBody({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("px-6 py-5", className)}>{children}</div>;
}

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export function Button({
  variant = "primary",
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  const variants: Record<ButtonVariant, string> = {
    primary: "bg-brand-600 text-white shadow-sm hover:bg-brand-700 hover:shadow active:scale-[0.98] disabled:bg-brand-600/60",
    secondary: "bg-white text-slate-700 ring-1 ring-slate-200 shadow-sm hover:bg-slate-50 hover:ring-slate-300 active:scale-[0.98] dark:bg-slate-700 dark:text-slate-200 dark:ring-slate-600 dark:hover:bg-slate-600",
    ghost: "text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200",
    danger: "bg-red-600 text-white shadow-sm hover:bg-red-700 active:scale-[0.98]",
  };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-all disabled:cursor-not-allowed",
        variants[variant],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm shadow-sm transition placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-brand-400",
        className,
      )}
      {...rest}
    />
  );
}

export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm shadow-sm transition placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-brand-400",
        className,
      )}
      {...rest}
    />
  );
}

export function Label({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
      {children}
    </label>
  );
}

type BadgeTone = "green" | "amber" | "red" | "slate" | "blue";
export function Badge({ tone = "slate", children }: { tone?: BadgeTone; children: ReactNode }) {
  const tones: Record<BadgeTone, string> = {
    green: "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-900/30 dark:text-emerald-400 dark:ring-emerald-500/30",
    amber: "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-900/30 dark:text-amber-400 dark:ring-amber-500/30",
    red: "bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-900/30 dark:text-red-400 dark:ring-red-500/30",
    slate: "bg-slate-100 text-slate-600 ring-slate-500/20 dark:bg-slate-700 dark:text-slate-300 dark:ring-slate-500/30",
    blue: "bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-900/30 dark:text-blue-400 dark:ring-blue-500/30",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset", tones[tone])}>
      {children}
    </span>
  );
}

export function Stat({ label, value, hint, trend }: { label: string; value: string; hint?: string; trend?: "up" | "down" }) {
  return (
    <Card className="p-6">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</span>
        {trend ? (
          <span className={cn("text-xs font-semibold", trend === "up" ? "text-emerald-600" : "text-red-600")}>
            {trend === "up" ? "↑" : "↓"}
          </span>
        ) : null}
      </div>
      {hint ? <div className="mt-1.5 text-[12px] text-slate-500 dark:text-slate-400">{hint}</div> : null}
    </Card>
  );
}

export function EmptyState({ title, hint, icon }: { title: string; hint?: string; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-12 text-center dark:border-slate-700 dark:bg-slate-800/50">
      {icon ? <div className="mb-3 text-slate-400">{icon}</div> : (
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-700">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M20 13V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7" />
            <path d="M16 19h6M19 16v6" />
          </svg>
        </div>
      )}
      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{title}</p>
      {hint ? <p className="mt-1 max-w-xs text-[13px] text-slate-500 dark:text-slate-400">{hint}</p> : null}
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { User } from "@/lib/types";
import { cn } from "@/lib/cn";
import { useState } from "react";
import { UserMenu } from "./user-menu";
import { ThemeToggle } from "./theme-toggle";

export interface NavItem {
  href: string;
  label: string;
  icon?: string;
}

export function Sidebar({ user, items, brand }: { user: User; items: NavItem[]; brand: string }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navContent = (
    <>
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-blue-700 text-sm font-bold text-white shadow-md">
            SC
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">Society Connect</div>
            <div className="truncate text-[11px] text-slate-500 dark:text-slate-400">{brand}</div>
          </div>
        </div>
        <ThemeToggle />
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {items.map((item) => {
          // A nav item is a "parent" if any other sibling item starts with its href + "/".
          // In that case, only use exact match to avoid the active state leaking into children.
          const hasChildSibling = items.some(
            (other) => other.href !== item.href && other.href.startsWith(item.href + "/")
          );
          const isRoot = item.href === "/admin" || item.href === "/resident" || item.href === "/guard";
          const isActive =
            pathname === item.href ||
            (!isRoot && !hasChildSibling && pathname.startsWith(item.href + "/"));
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition",
                isActive
                  ? "bg-brand-50 text-brand-700 shadow-sm ring-1 ring-brand-100 dark:bg-brand-900/30 dark:text-brand-400 dark:ring-brand-800"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-700/50 dark:hover:text-slate-200",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-100 px-3 py-3 dark:border-slate-800">
        <UserMenu user={user} />
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Top Header Bar */}
      <header className="fixed top-0 left-0 right-0 z-30 flex h-14 items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur-md lg:hidden dark:border-slate-800 dark:bg-slate-900/95">
        <button
          onClick={() => setMobileOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          aria-label="Open menu"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12h18M3 6h18M3 18h18" />
          </svg>
        </button>

        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-brand-600 to-blue-700 text-xs font-bold text-white shadow-sm shrink-0">
            SC
          </div>
          <span className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate max-w-[180px] sm:max-w-xs">
            {brand || "Society Connect"}
          </span>
        </div>

        <ThemeToggle />
      </header>

      {/* Mobile drawer overlay */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative flex h-full w-72 flex-col border-r border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3.5 top-4 rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              aria-label="Close menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
            {navContent}
          </aside>
        </div>
      ) : null}

      {/* Desktop sticky sidebar */}
      <aside className="hidden w-64 flex-col border-r border-slate-200/80 bg-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:overflow-y-auto dark:border-slate-800 dark:bg-slate-900">
        {navContent}
      </aside>
    </>
  );
}

export function PageHeader({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{title}</h1>
        {description ? <p className="mt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { User } from "@/lib/types";
import { cn } from "@/lib/cn";
import { useState } from "react";
import { UserMenu } from "./user-menu";

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
      <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-5 dark:border-slate-700">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-blue-700 text-sm font-bold text-white shadow-md">
          SC
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">Society Connect</div>
          <div className="truncate text-[11px] text-slate-500 dark:text-slate-400">{brand}</div>
        </div>
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
      <div className="border-t border-slate-100 px-3 py-3 dark:border-slate-700">
        <UserMenu user={user} />
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-40 rounded-lg border border-slate-200 bg-white p-2 shadow-sm lg:hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
        aria-label="Open menu"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 12h18M3 6h18M3 18h18" />
        </svg>
      </button>

      {/* Mobile overlay */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative flex h-full w-72 flex-col border-r border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-3 rounded-md p-1 text-slate-400 hover:text-slate-600"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
            {navContent}
          </aside>
        </div>
      ) : null}

      {/* Desktop sidebar */}
      <aside className="hidden w-64 flex-col border-r border-slate-100 bg-white lg:flex dark:border-slate-700 dark:bg-slate-900">
        {navContent}
      </aside>
    </>
  );
}

export function PageHeader({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-8 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{title}</h1>
        {description ? <p className="mt-1.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

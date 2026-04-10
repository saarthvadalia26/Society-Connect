import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Sidebar, type NavItem } from "@/components/nav";

const items: NavItem[] = [
  { href: "/guard", label: "Gate" },
];

export default async function GuardLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "guard") {
    if (user.role === "admin") redirect("/admin");
    redirect("/resident");
  }
  const society = await db.getSociety(user.society_id);
  return (
    <div className="flex min-h-screen bg-slate-50/50 dark:bg-slate-950">
      <Sidebar user={user} items={items} brand={society?.name ?? "Society"} />
      <main className="flex-1 overflow-x-hidden px-4 py-6 pt-16 lg:px-10 lg:py-8 lg:pt-8">{children}</main>
    </div>
  );
}

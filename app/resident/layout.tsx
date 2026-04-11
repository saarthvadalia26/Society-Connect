import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Sidebar, type NavItem } from "@/components/nav";

const items: NavItem[] = [
  { href: "/resident", label: "Home" },
  { href: "/resident/ledger", label: "My ledger" },
  { href: "/resident/notices", label: "Notices" },
  { href: "/resident/complaints", label: "Help desk" },
  { href: "/resident/contacts", label: "Trusted contacts" },
  { href: "/resident/facilities", label: "Book facility" },
  { href: "/resident/visitors", label: "Guest invites" },
];

export default async function ResidentLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "resident") redirect("/admin");
  const society = await db.getSociety(user.society_id);
  return (
    <div className="dark flex min-h-screen bg-[#0f172a] text-slate-50">
      <Sidebar user={user} items={items} brand={society?.name ?? "Society"} />
      <main className="flex-1 overflow-x-hidden px-4 py-6 pt-16 lg:px-10 lg:py-8 lg:pt-8">{children}</main>
    </div>
  );
}

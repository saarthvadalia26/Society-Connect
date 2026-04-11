import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { db, fmtCurrency, fmtPeriod, currentPeriod } from "@/lib/db";
import { Card, CardBody, CardHeader, Stat, Badge, EmptyState, Button } from "@/components/ui";
import { PageHeader } from "@/components/nav";
import { CollectionChart } from "@/components/chart";

export default async function AdminDashboard() {
  const user = await requireRole("admin");
  const period = currentPeriod();
  const [bills, expenses, allComplaints, allNotices, defaulters, monthly] = await Promise.all([
    db.listBills(user.society_id, period),
    db.listExpenses(user.society_id),
    db.listComplaints(user.society_id),
    db.listNotices(user.society_id),
    db.defaulters(user.society_id),
    db.monthlyCollection(user.society_id, 6),
  ]);
  const collected = bills.filter((b) => b.status === "paid").reduce((s, b) => s + b.amount, 0);
  const outstanding = bills.filter((b) => b.status === "unpaid").reduce((s, b) => s + b.amount, 0);
  const monthExpenses = expenses
    .filter((e) => e.spent_on.startsWith(period))
    .reduce((s, e) => s + e.amount, 0);
  const openComplaints = allComplaints.filter((c) => c.status === "open");
  const recentNotices = allNotices.slice(0, 3);

  const society = await db.getSociety(user.society_id);

  return (
    <div>
      <PageHeader
        title={`${society?.name ?? "Dashboard"}`}
        description={`${fmtPeriod(period)} — at-a-glance view of collections, expenses, and open issues.`}
      />

      {/* Quick actions */}
      <div className="mb-6 flex flex-wrap gap-2">
        <Link href="/admin/bills"><Button variant="primary">Generate bills</Button></Link>
        <Link href="/admin/notices"><Button variant="secondary">Post notice</Button></Link>
        <Link href="/admin/members"><Button variant="secondary">Add member</Button></Link>
        <Link href="/admin/expenses"><Button variant="secondary">Log expense</Button></Link>
        <Link href="/admin/reports"><Button variant="secondary">Download report</Button></Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Collected"
          value={fmtCurrency(collected, user.currency)}
          hint={`${bills.filter((b) => b.status === "paid").length} of ${bills.length} flats paid`}
        />
        <Stat
          label="Outstanding"
          value={fmtCurrency(outstanding, user.currency)}
          hint={`${bills.filter((b) => b.status === "unpaid").length} unpaid bills`}
        />
        <Stat
          label="Expenses"
          value={fmtCurrency(monthExpenses, user.currency)}
          hint={`${expenses.filter((e) => e.spent_on.startsWith(period)).length} entries this month`}
        />
        <Stat
          label="Open complaints"
          value={String(openComplaints.length)}
          hint={`${defaulters.length} defaulter flat${defaulters.length !== 1 ? "s" : ""}`}
        />
      </div>

      <Card className="mt-6">
        <CardHeader title="Collection vs Outstanding" subtitle="Last 6 months — bring this to your committee meetings." />
        <CardBody>
          <CollectionChart data={monthly} currency={user.currency} />
        </CardBody>
      </Card>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Recent notices"
            action={<Link href="/admin/notices" className="text-xs font-medium text-brand-600 hover:underline">View all →</Link>}
          />
          <CardBody>
            {recentNotices.length === 0 ? (
              <EmptyState title="No notices yet" hint="Post one from the Notice board." />
            ) : (
              <ul className="divide-y divide-slate-800">
                {recentNotices.map((n) => (
                  <li key={n.id} className="rounded-lg bg-slate-800/10 px-4 py-3 mb-2 last:mb-0 border border-slate-700/50">
                    <div className="!text-lg !font-bold !text-[#ffffff]" style={{ color: '#ffffff' }}>{n.title}</div>
                    <div className="mt-1 line-clamp-2 text-[13px] leading-relaxed !text-[#e2e8f0]" style={{ color: '#e2e8f0' }}>{n.body}</div>
                    <div className="mt-2 text-[11px] !text-[#94a3b8]" style={{ color: '#94a3b8' }}>{new Date(n.created_at).toLocaleDateString("en-IN")}</div>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Open complaints"
            action={<Link href="/admin/complaints" className="text-xs font-medium text-brand-600 hover:underline">View all →</Link>}
          />
          <CardBody>
            {openComplaints.length === 0 ? (
              <EmptyState title="All clear" hint="No open complaints." />
            ) : (
              <ul className="divide-y divide-slate-100">
                {openComplaints.slice(0, 5).map((c) => (
                  <li key={c.id} className="flex items-start justify-between gap-3 rounded-lg bg-slate-800/10 px-4 py-3 mb-2 last:mb-0 border border-slate-700/50">
                    <div>
                      <div className="!text-lg !font-bold !text-[#ffffff]" style={{ color: '#ffffff' }}>{c.category}</div>
                      <div className="mt-0.5 text-[13px] !text-[#94a3b8]">
                        Flat {c.flat?.block}-{c.flat?.number}
                      </div>
                      <div className="mt-1 line-clamp-2 text-[13px] leading-relaxed !text-[#e2e8f0]" style={{ color: '#e2e8f0' }}>
                        {c.description}
                      </div>
                    </div>
                    <Badge tone="amber">open</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { db, fmtINR, fmtPeriod } from "@/lib/db";
import { Card, CardBody, CardHeader, Button, Stat, Badge, EmptyState } from "@/components/ui";
import { PageHeader } from "@/components/nav";

export default async function ResidentHome() {
  const user = await requireRole("resident");
  const [flat, bills, allNotices, myComplaints] = await Promise.all([
    user.flat_id ? db.getFlat(user.flat_id) : Promise.resolve(undefined),
    user.flat_id ? db.listBillsForFlat(user.flat_id) : Promise.resolve([]),
    db.listNotices(user.society_id),
    user.flat_id ? db.listComplaintsForFlat(user.flat_id) : Promise.resolve([]),
  ]);
  const unpaid = bills.filter((b) => b.status === "unpaid");
  const nextDue = unpaid[unpaid.length - 1] ?? unpaid[0];
  const totalDue = unpaid.reduce((s, b) => s + b.amount, 0);
  const notices = allNotices.slice(0, 4);
  const openComplaints = myComplaints.filter((c) => c.status === "open").length;

  return (
    <div>
      <PageHeader
        title={`Welcome, ${user.name.split(" ")[0]}`}
        description={flat ? `Block ${flat.block} · Flat ${flat.number}` : "No flat assigned yet"}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat
          label="Total dues"
          value={fmtINR(totalDue)}
          hint={unpaid.length ? `${unpaid.length} unpaid bill${unpaid.length > 1 ? "s" : ""}` : "All clear"}
        />
        <Stat
          label="Next due"
          value={nextDue ? fmtPeriod(nextDue.period) : "—"}
          hint={nextDue ? `${fmtINR(nextDue.amount)} by ${nextDue.due_date}` : "Nothing pending"}
        />
        <Stat label="Open tickets" value={String(openComplaints)} hint={`${myComplaints.length} total raised`} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Maintenance dues"
            action={
              <Link href="/resident/ledger">
                <Button variant="secondary">Open ledger →</Button>
              </Link>
            }
          />
          <CardBody>
            {unpaid.length === 0 ? (
              <EmptyState title="No dues" hint="You're up to date — thank you!" />
            ) : (
              <ul className="divide-y divide-slate-100">
                {unpaid.slice(0, 4).map((b) => (
                  <li key={b.id} className="flex items-center justify-between py-2 first:pt-0 last:pb-0">
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">{fmtPeriod(b.period)}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">Due {b.due_date}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">{fmtINR(b.amount)}</span>
                      <Badge tone="amber">unpaid</Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Latest notices" />
          <CardBody>
            {notices.length === 0 ? (
              <EmptyState title="No notices" />
            ) : (
              <ul className="divide-y divide-slate-100">
                {notices.map((n) => (
                  <li key={n.id} className="py-2 first:pt-0 last:pb-0">
                    <div className="text-sm font-bold text-slate-900 dark:text-white">{n.title}</div>
                    <div className="line-clamp-2 mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-200">{n.body}</div>
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

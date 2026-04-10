import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { db, fmtINR, fmtPeriod, currentPeriod } from "@/lib/db";
import { Card, CardBody, CardHeader, Button, Badge, EmptyState } from "@/components/ui";
import { PageHeader } from "@/components/nav";
import { NudgeLink } from "@/components/nudge";

async function generateBillsAction(formData: FormData) {
  "use server";
  const user = await requireRole("admin");
  const period = String(formData.get("period") ?? currentPeriod());
  const amount = Number(formData.get("amount") ?? 3000);
  await db.generateBillsForPeriod(user.society_id, period, amount);
  revalidatePath("/admin/bills");
  redirect("/admin/bills");
}

async function markPaidAction(formData: FormData) {
  "use server";
  await requireRole("admin");
  const billId = String(formData.get("billId") ?? "");
  if (billId) await db.markBillPaid(billId);
  revalidatePath("/admin/bills");
  redirect("/admin/bills");
}

export default async function AdminBillsPage({ searchParams }: { searchParams: { period?: string } }) {
  const user = await requireRole("admin");
  const period = searchParams.period ?? currentPeriod();
  const [bills, allBills, flats, owners] = await Promise.all([
    db.listBills(user.society_id, period),
    db.listBills(user.society_id),
    db.listFlats(user.society_id),
    db.listUsers(user.society_id),
  ]);
  const allPeriods = Array.from(new Set(allBills.map((b) => b.period))).sort().reverse();
  const collected = bills.filter((b) => b.status === "paid").reduce((s, b) => s + b.amount, 0);
  const outstanding = bills.filter((b) => b.status === "unpaid").reduce((s, b) => s + b.amount, 0);
  const flatById = new Map(flats.map((f) => [f.id, f] as const));
  const ownerById = new Map(owners.map((u) => [u.id, u] as const));

  return (
    <div>
      <PageHeader
        title="Maintenance bills"
        description="Generate the monthly bill for every flat in one click. Track payment status in real time."
        action={
          <Link href="/admin/bills/defaulters">
            <Button variant="secondary">View defaulters →</Button>
          </Link>
        }
      />

      <Card>
        <CardHeader title="Generate bills" subtitle="Idempotent — running twice for the same month is safe." />
        <CardBody>
          <form action={generateBillsAction} className="flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-600">Period (YYYY-MM)</label>
              <input
                name="period"
                defaultValue={currentPeriod()}
                pattern="\d{4}-\d{2}"
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-600">Amount per flat (₹)</label>
              <input
                name="amount"
                type="number"
                defaultValue={3000}
                min={0}
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <Button type="submit">Generate bills</Button>
          </form>
        </CardBody>
      </Card>

      <Card className="mt-6">
        <CardHeader
          title={`Bills for ${fmtPeriod(period)}`}
          subtitle={`${fmtINR(collected)} collected · ${fmtINR(outstanding)} outstanding`}
          action={
            <form className="flex items-center gap-2">
              <label className="text-xs text-slate-500">Period</label>
              <select
                name="period"
                defaultValue={period}
                className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
              >
                {allPeriods.map((p) => (
                  <option key={p} value={p}>
                    {fmtPeriod(p)}
                  </option>
                ))}
              </select>
              <Button variant="secondary" type="submit">
                Apply
              </Button>
            </form>
          }
        />
        <CardBody>
          {bills.length === 0 ? (
            <EmptyState title="No bills for this month yet" hint="Click 'Generate bills' above." />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                    <th className="py-2 pr-4">Flat</th>
                    <th className="py-2 pr-4">Owner</th>
                    <th className="py-2 pr-4">Amount</th>
                    <th className="py-2 pr-4">Due</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bills.map((bill) => {
                    const flat = flatById.get(bill.flat_id);
                    const owner = flat?.owner_user_id ? ownerById.get(flat.owner_user_id) : undefined;
                    return (
                      <tr key={bill.id} className="border-b border-slate-100">
                        <td className="py-2 pr-4 font-medium text-slate-900">
                          {flat?.block}-{flat?.number}
                        </td>
                        <td className="py-2 pr-4 text-slate-700">{owner?.name ?? "—"}</td>
                        <td className="py-2 pr-4 text-slate-900">{fmtINR(bill.amount)}</td>
                        <td className="py-2 pr-4 text-slate-500">{bill.due_date}</td>
                        <td className="py-2 pr-4">
                          {bill.status === "paid" ? <Badge tone="green">paid</Badge> : <Badge tone="amber">unpaid</Badge>}
                        </td>
                        <td className="py-2 pr-4">
                          {bill.status === "unpaid" ? (
                            <div className="flex items-center gap-2">
                              <form action={markPaidAction}>
                                <input type="hidden" name="billId" value={bill.id} />
                                <Button variant="secondary" type="submit">
                                  Mark paid
                                </Button>
                              </form>
                              {owner ? (
                                <NudgeLink
                                  name={owner.name}
                                  phone={null}
                                  amount={bill.amount}
                                  period={fmtPeriod(bill.period)}
                                  flat={`${flat?.block}-${flat?.number}`}
                                />
                              ) : null}
                            </div>
                          ) : (
                            <a
                              href={`/api/receipts/${bill.id}`}
                              className="text-xs font-medium text-brand-600 hover:underline"
                            >
                              {bill.serial_no ?? "Receipt"} ↓
                            </a>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

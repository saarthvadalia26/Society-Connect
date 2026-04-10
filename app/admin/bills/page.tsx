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
  try {
    const user = await requireRole("admin");
    const period = String(formData.get("period") ?? currentPeriod()).trim();
    const amount = Number(formData.get("amount") ?? 3000);

    if (!/^\d{4}-\d{2}$/.test(period)) {
      redirect("/admin/bills?error=" + encodeURIComponent("Invalid period format. Use YYYY-MM."));
    }
    if (isNaN(amount) || amount < 0) {
      redirect("/admin/bills?error=" + encodeURIComponent("Invalid amount."));
    }

    const created = await db.generateBillsForPeriod(user.society_id, period, amount);
    revalidatePath("/admin/bills");
    redirect("/admin/bills?success=" + encodeURIComponent(`Generated ${created} bill(s) for ${period}.`));
  } catch (err: any) {
    // Next.js redirect() throws internally — let it propagate normally
    if (err?.digest?.startsWith("NEXT_REDIRECT")) throw err;
    console.error("[generateBillsAction] Failed:", err);
    redirect("/admin/bills?error=" + encodeURIComponent(err?.message ?? "Failed to generate bills."));
  }
}

async function markPaidAction(formData: FormData) {
  "use server";
  await requireRole("admin");
  const billId = String(formData.get("billId") ?? "");
  if (billId) await db.markBillPaid(billId);
  revalidatePath("/admin/bills");
  redirect("/admin/bills");
}

export default async function AdminBillsPage({ searchParams }: { searchParams: { period?: string; error?: string; success?: string } }) {
  const user = await requireRole("admin");
  const period = searchParams.period ?? currentPeriod();
  const errorMsg = searchParams.error;
  const successMsg = searchParams.success;
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

      {/* Success / Error feedback banners */}
      {successMsg && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-400">
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-400">
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {errorMsg}
        </div>
      )}

      <Card>
        <CardHeader title="Generate bills" subtitle="Idempotent — running twice for the same month is safe." />
        <CardBody>
          <form action={generateBillsAction} className="flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Period (YYYY-MM)</label>
              <input
                name="period"
                defaultValue={currentPeriod()}
                pattern="\d{4}-\d{2}"
                placeholder="e.g. 2026-04"
                style={{ color: '#0f172a' }}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium placeholder:text-slate-400 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Amount per flat (₹)</label>
              <input
                name="amount"
                type="number"
                defaultValue={3000}
                min={0}
                placeholder="e.g. 3000"
                style={{ color: '#0f172a' }}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium placeholder:text-slate-400 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
                style={{ color: '#0f172a' }}
                className="rounded-md border border-slate-200 bg-white px-2 py-1 text-sm font-medium shadow-sm"
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
                  <tr className="border-b border-slate-700/50 dark:border-slate-700 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-500">
                    <th className="py-3 pr-4">Flat</th>
                    <th className="py-3 pr-4">Owner</th>
                    <th className="py-3 pr-4">Amount</th>
                    <th className="py-3 pr-4">Due</th>
                    <th className="py-3 pr-4">Status</th>
                    <th className="py-3 pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bills.map((bill) => {
                    const flat = flatById.get(bill.flat_id);
                    const owner = flat?.owner_user_id ? ownerById.get(flat.owner_user_id) : undefined;
                    return (
                      <tr key={bill.id} className="border-b border-slate-800/40 dark:border-slate-700/50 transition-colors hover:bg-slate-50/5">
                        <td className="py-3 pr-4 font-semibold text-slate-900 dark:text-slate-100">
                          {flat?.block}-{flat?.number}
                        </td>
                        <td className="py-3 pr-4 text-slate-700 dark:text-slate-300">{owner?.name ?? "—"}</td>
                        <td className="py-3 pr-4 font-bold text-slate-900 dark:text-white">{fmtINR(bill.amount)}</td>
                        <td className="py-3 pr-4 text-slate-500 dark:text-slate-400">{bill.due_date}</td>
                        <td className="py-3 pr-4">
                          {bill.status === "paid"
                            ? <Badge tone="green">paid</Badge>
                            : <span className="inline-flex items-center rounded-full border border-orange-500/20 bg-orange-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-orange-500">unpaid</span>
                          }
                        </td>
                        <td className="py-2 pr-4">
                          {bill.status === "unpaid" ? (
                            <div className="flex items-center gap-2">
                              <form action={markPaidAction}>
                                <input type="hidden" name="billId" value={bill.id} />
                                <Button variant="secondary" type="submit" className="border-slate-300 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700">
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

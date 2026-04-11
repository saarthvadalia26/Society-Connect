import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { db, fmtCurrency, fmtPeriod } from "@/lib/db";
import { Card, CardBody, CardHeader, Button, Badge, EmptyState } from "@/components/ui";
import { PageHeader } from "@/components/nav";

async function payAction(formData: FormData) {
  "use server";
  const user = await requireRole("resident");
  const billId = String(formData.get("billId") ?? "");
  if (!billId) return;
  // Stubbed payment: in v2 this hits Razorpay, on success calls markBillPaid.
  await db.markBillPaid(billId);
  revalidatePath("/resident/ledger");
  redirect("/resident/ledger");
}

export default async function LedgerPage() {
  const user = await requireRole("resident");
  if (!user.flat_id) {
    return (
      <div>
        <PageHeader title="My ledger" />
        <EmptyState title="No flat assigned" hint="Ask the management committee to link your flat." />
      </div>
    );
  }
  const bills = await db.listBillsForFlat(user.flat_id);
  const paid = bills.filter((b) => b.status === "paid");
  const unpaid = bills.filter((b) => b.status === "unpaid");
  const totalDue = unpaid.reduce((s, b) => s + b.amount, 0);

  return (
    <div>
      <PageHeader
        title="My ledger"
        description="Every maintenance bill, paid or pending. Pay outstanding dues with one click."
      />

      <Card>
        <CardHeader title={`Outstanding · ${fmtCurrency(totalDue, user.currency)}`} />
        <CardBody>
          {unpaid.length === 0 ? (
            <EmptyState title="You're all paid up" hint="No outstanding dues." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {unpaid.map((b) => (
                <li key={b.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div>
                    <div className="text-sm font-medium text-slate-900">{fmtPeriod(b.period)}</div>
                    <div className="text-xs text-slate-500">Due {b.due_date}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-slate-900">{fmtCurrency(b.amount, user.currency)}</span>
                    <form action={payAction}>
                      <input type="hidden" name="billId" value={b.id} />
                      <Button type="submit">Pay now</Button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      <Card className="mt-6">
        <CardHeader title={`Payment history (${paid.length})`} />
        <CardBody>
          {paid.length === 0 ? (
            <EmptyState title="No payments yet" />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700/40 dark:border-slate-700 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3 pr-4">Period</th>
                    <th className="py-3 pr-4">Amount</th>
                    <th className="py-3 pr-4">Paid on</th>
                    <th className="py-3 pr-4">Receipt</th>
                    <th className="py-3 pr-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paid.map((b) => (
                    <tr key={b.id} className="border-b border-slate-100 dark:border-slate-700/50 transition-colors hover:bg-slate-800/60">
                      <td className="py-3 pr-4 font-semibold text-slate-900 dark:text-slate-100">{fmtPeriod(b.period)}</td>
                      <td className="py-3 pr-4 font-bold text-slate-900 dark:text-white">{fmtCurrency(b.amount, user.currency)}</td>
                      <td className="py-3 pr-4 text-slate-500 dark:text-slate-400">
                        {b.paid_at ? new Date(b.paid_at).toLocaleDateString("en-IN") : "—"}
                      </td>
                      <td className="py-3 pr-4">
                        <a
                          href={`/api/receipts/${b.id}`}
                          className="text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline"
                        >
                          {b.serial_no ?? "Download"} ↓
                        </a>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400">paid</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

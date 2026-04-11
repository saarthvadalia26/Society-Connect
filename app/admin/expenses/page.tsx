import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { db, fmtCurrency } from "@/lib/db";
import { Card, CardBody, CardHeader, Button, Input, Label, Textarea, EmptyState } from "@/components/ui";
import { PageHeader } from "@/components/nav";
import { SubmitButton } from "@/components/submit-button";

async function addExpenseAction(formData: FormData) {
  "use server";
  const user = await requireRole("admin");
  const category = String(formData.get("category") ?? "").trim();
  const vendor = String(formData.get("vendor") ?? "").trim();
  const amount = Number(formData.get("amount") ?? 0);
  const note = String(formData.get("note") ?? "").trim() || null;
  const spent_on = String(formData.get("spent_on") ?? new Date().toISOString().slice(0, 10));
  if (!category || !vendor || !amount) return;
  await db.addExpense({ society_id: user.society_id, category, vendor, amount, note, spent_on });
  revalidatePath("/admin/expenses");
  redirect("/admin/expenses?toast=Expense%20added%20successfully!");
}

export default async function ExpensesPage() {
  const user = await requireRole("admin");
  const expenses = await db.listExpenses(user.society_id);
  const total = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div>
      <PageHeader title="Expenses" description="Log every rupee spent — vendors, repairs, utilities. The audit-day lifesaver." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader title="Log expense" />
          <CardBody>
            <form action={addExpenseAction} className="space-y-3">
              <div>
                <Label htmlFor="category">Category</Label>
                <Input id="category" name="category" required placeholder="e.g. Utilities" />
              </div>
              <div>
                <Label htmlFor="vendor">Vendor</Label>
                <Input id="vendor" name="vendor" required placeholder="e.g. City Water Tankers" />
              </div>
              <div>
                <Label htmlFor="amount">Amount (₹)</Label>
                <Input id="amount" name="amount" type="number" min={1} required />
              </div>
              <div>
                <Label htmlFor="spent_on">Date</Label>
                <Input id="spent_on" name="spent_on" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required style={{ color: '#0f172a' }} />
              </div>
              <div>
                <Label htmlFor="note">Note</Label>
                <Textarea id="note" name="note" rows={2} placeholder="Optional details" />
              </div>
              <SubmitButton loadingText="Saving...">Save expense</SubmitButton>
            </form>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title={`All expenses · ${fmtCurrency(total, user.currency)}`} />
          <CardBody>
            {expenses.length === 0 ? (
              <EmptyState title="No expenses logged" hint="Use the form to add your first entry." />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700/40 dark:border-slate-700 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                      <th className="py-3 pr-4">Date</th>
                      <th className="py-3 pr-4">Category</th>
                      <th className="py-3 pr-4">Vendor</th>
                      <th className="py-3 pr-4">Amount</th>
                      <th className="py-3 pr-4">Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((e) => (
                      <tr key={e.id} className="border-b border-slate-100 dark:border-slate-700/50 transition-colors hover:bg-slate-800/60">
                        <td className="py-3 pr-4 text-slate-500 dark:text-slate-400">{e.spent_on}</td>
                        <td className="py-3 pr-4 font-semibold text-slate-900 dark:text-slate-100">{e.category}</td>
                        <td className="py-3 pr-4 text-slate-700 dark:text-slate-300">{e.vendor}</td>
                        <td className="py-3 pr-4 font-bold text-slate-900 dark:text-white">{fmtCurrency(e.amount, user.currency)}</td>
                        <td className="py-3 pr-4 text-slate-500 dark:text-slate-400">{e.note ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

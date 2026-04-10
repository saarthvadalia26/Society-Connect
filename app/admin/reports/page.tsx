import { requireRole } from "@/lib/auth";
import { db, fmtINR } from "@/lib/db";
import { Card, CardBody, CardHeader, Stat } from "@/components/ui";
import { PageHeader } from "@/components/nav";

export default async function ReportsPage({ searchParams }: { searchParams: { year?: string } }) {
  const user = await requireRole("admin");
  const year = Number(searchParams.year ?? new Date().getFullYear());
  const summary = await db.yearlySummary(user.society_id, year);

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Year-end financial summary for your auditors. One click to a clean, signed-off PDF."
      />

      <Card className="mb-6">
        <CardHeader title="Financial year" />
        <CardBody>
          <form className="flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-600">Year</label>
              <input
                name="year"
                type="number"
                defaultValue={year}
                min={2000}
                max={2100}
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-md bg-white px-3 py-1.5 text-sm font-medium text-slate-900 ring-1 ring-slate-300 hover:bg-slate-50"
            >
              Update
            </button>
            <a
              href={`/api/reports/yearly?year=${year}`}
              className="inline-flex items-center justify-center rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
            >
              Download {year} PDF ↓
            </a>
          </form>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Collected" value={fmtINR(summary.collected)} hint={`${summary.bills.filter((b) => b.status === "paid").length} bills paid`} />
        <Stat label="Outstanding" value={fmtINR(summary.outstanding)} hint={`${summary.bills.filter((b) => b.status === "unpaid").length} bills unpaid`} />
        <Stat label="Expenses" value={fmtINR(summary.totalExpenses)} hint={`${summary.expenses.length} entries`} />
        <Stat label="Net" value={fmtINR(summary.net)} hint="Collected − expenses" />
      </div>
    </div>
  );
}

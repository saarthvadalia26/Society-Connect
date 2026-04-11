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
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Year</label>
              <input
                name="year"
                type="number"
                defaultValue={year}
                min={2000}
                max={2100}
                style={{ color: '#0f172a' }}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-lg border border-slate-700 bg-transparent px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-800"
            >
              Update
            </button>
            <a
              href={`/api/reports/yearly?year=${year}`}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 hover:shadow-md"
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

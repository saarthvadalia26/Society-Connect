import { requireRole } from "@/lib/auth";
import { db, fmtCurrency } from "@/lib/db";
import { Card, CardBody, CardHeader, EmptyState, Badge } from "@/components/ui";
import { PageHeader } from "@/components/nav";
import { NudgeLink } from "@/components/nudge";

export default async function DefaultersPage() {
  const user = await requireRole("admin");
  const { green, yellow, red } = await db.trafficLight(user.society_id);
  const totalOutstanding =
    yellow.reduce((s, r) => s + r.outstanding, 0) + red.reduce((s, r) => s + r.outstanding, 0);

  return (
    <div>
      <PageHeader
        title="Defaulter dashboard"
        description="Traffic-light view of every flat. Use this as your Sunday-meeting follow-up sheet."
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Green · Up to date</div>
          <div className="mt-1 text-3xl font-bold text-emerald-900">{green.length}</div>
          <div className="mt-1 text-xs text-emerald-700">flats</div>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <div className="text-xs font-semibold uppercase tracking-wide text-amber-800">Yellow · 1–2 unpaid</div>
          <div className="mt-1 text-3xl font-bold text-amber-900">{yellow.length}</div>
          <div className="mt-1 text-xs text-amber-800">flats — gentle nudge</div>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-5">
          <div className="text-xs font-semibold uppercase tracking-wide text-red-700">Red · 3+ months</div>
          <div className="mt-1 text-3xl font-bold text-red-900">{red.length}</div>
          <div className="mt-1 text-xs text-red-700">flats — critical</div>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader title={`Critical · Red (${red.length})`} subtitle={`${fmtCurrency(red.reduce((s, r) => s + r.outstanding, 0))} outstanding`} />
        <CardBody>
          {red.length === 0 ? (
            <EmptyState title="No critical defaulters" />
          ) : (
            <ul className="divide-y divide-slate-100">
              {red.map((r) => (
                <li key={r.flat.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      Flat {r.flat.block}-{r.flat.number} · {r.owner?.name ?? "—"}
                    </div>
                    <div className="text-xs text-slate-500">
                      {r.unpaidCount} unpaid months · {fmtCurrency(r.outstanding, user.currency)} outstanding
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone="red">{r.unpaidCount} unpaid</Badge>
                    {r.owner ? (
                      <NudgeLink
                        name={r.owner.name}
                        phone={null}
                        amount={r.outstanding}
                        period={`${r.unpaidCount} months`}
                        flat={`${r.flat.block}-${r.flat.number}`}
                      />
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      <Card className="mb-6">
        <CardHeader title={`Yellow (${yellow.length})`} subtitle={`${fmtCurrency(yellow.reduce((s, r) => s + r.outstanding, 0))} outstanding`} />
        <CardBody>
          {yellow.length === 0 ? (
            <EmptyState title="No flats in yellow" />
          ) : (
            <ul className="divide-y divide-slate-100">
              {yellow.map((r) => (
                <li key={r.flat.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      Flat {r.flat.block}-{r.flat.number} · {r.owner?.name ?? "—"}
                    </div>
                    <div className="text-xs text-slate-500">
                      {r.unpaidCount} unpaid · {fmtCurrency(r.outstanding, user.currency)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone="amber">{r.unpaidCount} unpaid</Badge>
                    {r.owner ? (
                      <NudgeLink
                        name={r.owner.name}
                        phone={null}
                        amount={r.outstanding}
                        period={`${r.unpaidCount} months`}
                        flat={`${r.flat.block}-${r.flat.number}`}
                      />
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={`Green (${green.length})`} subtitle="No follow-up needed" />
        <CardBody>
          {green.length === 0 ? (
            <EmptyState title="No flats in green" />
          ) : (
            <div className="flex flex-wrap gap-2">
              {green.map((r) => (
                <Badge key={r.flat.id} tone="green">
                  {r.flat.block}-{r.flat.number}
                </Badge>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      <div className="mt-6 text-xs text-slate-500">
        Total outstanding across the society: <span className="font-semibold text-slate-700">{fmtCurrency(totalOutstanding, user.currency)}</span>
      </div>
    </div>
  );
}

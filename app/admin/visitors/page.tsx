import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardBody, CardHeader, EmptyState, Badge } from "@/components/ui";
import { PageHeader } from "@/components/nav";

export default async function AdminVisitorsPage() {
  const user = await requireRole("admin");
  const visitors = await db.listVisitorsForSociety(user.society_id);

  return (
    <div>
      <PageHeader title="Visitor log" description="Audit trail of every guest invite and gate entry across the society." />
      <Card>
        <CardHeader title={`${visitors.length} entries`} />
        <CardBody>
          {visitors.length === 0 ? (
            <EmptyState title="No visitors yet" hint="Residents haven't created any invites." />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                    <th className="py-2 pr-4">Code</th>
                    <th className="py-2 pr-4">Guest</th>
                    <th className="py-2 pr-4">Flat</th>
                    <th className="py-2 pr-4">Purpose</th>
                    <th className="py-2 pr-4">Expected</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Entered at</th>
                  </tr>
                </thead>
                <tbody>
                  {visitors.map((v) => (
                    <tr key={v.id} className="border-b border-slate-100">
                      <td className="py-2 pr-4 font-mono text-xs text-slate-700">{v.entry_code}</td>
                      <td className="py-2 pr-4 font-medium text-slate-900">{v.name}</td>
                      <td className="py-2 pr-4 text-slate-700">
                        {v.flat ? `${v.flat.block}-${v.flat.number}` : "—"}
                      </td>
                      <td className="py-2 pr-4 text-slate-500">{v.purpose}</td>
                      <td className="py-2 pr-4 text-slate-500">{v.expected_on}</td>
                      <td className="py-2 pr-4">
                        {v.status === "entered" ? (
                          <Badge tone="green">entered</Badge>
                        ) : (
                          <Badge tone="amber">awaiting</Badge>
                        )}
                      </td>
                      <td className="py-2 pr-4 text-xs text-slate-500">
                        {v.entered_at ? new Date(v.entered_at).toLocaleString("en-IN") : "—"}
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

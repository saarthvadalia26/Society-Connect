import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardBody, CardHeader, EmptyState } from "@/components/ui";
import { PageHeader } from "@/components/nav";

export default async function ResidentNoticesPage() {
  const user = await requireRole("resident");
  const notices = await db.listNotices(user.society_id);

  return (
    <div>
      <PageHeader title="Notices" description="Society announcements from the management committee." />
      <Card>
        <CardHeader title={`${notices.length} notices`} />
        <CardBody>
          <div className="text-white">
            {notices.length === 0 ? (
              <EmptyState title="No notices yet" />
            ) : (
              <ul className="divide-y divide-slate-800">
                {notices.map((n) => (
                  <li key={n.id} className="p-4 border-b border-slate-800 last:border-0 hover:bg-slate-800/50 transition-colors text-white">
                    <div className="text-sm font-bold text-white opacity-100" style={{ color: '#ffffff' }}>{n.title}</div>
                    <div className="mt-1 whitespace-pre-wrap text-sm text-slate-200 opacity-100" style={{ color: '#e2e8f0' }}>{n.body}</div>
                    <div className="mt-2 text-[11px] text-slate-400 opacity-100" style={{ color: '#94a3b8' }}>{new Date(n.created_at).toLocaleString("en-IN")}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

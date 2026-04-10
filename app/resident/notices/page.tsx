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
          {notices.length === 0 ? (
            <EmptyState title="No notices yet" />
          ) : (
            <ul className="divide-y divide-slate-100">
              {notices.map((n) => (
                <li key={n.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="text-sm font-semibold text-slate-900">{n.title}</div>
                  <div className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{n.body}</div>
                  <div className="mt-2 text-[11px] text-slate-400">{new Date(n.created_at).toLocaleString("en-IN")}</div>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

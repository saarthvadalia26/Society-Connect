import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardBody, CardHeader, Button, Badge, EmptyState } from "@/components/ui";
import { PageHeader } from "@/components/nav";

async function resolveAction(formData: FormData) {
  "use server";
  await requireRole("admin");
  const id = String(formData.get("id") ?? "");
  if (id) await db.resolveComplaint(id);
  revalidatePath("/admin/complaints");
  redirect("/admin/complaints");
}

export default async function AdminComplaintsPage() {
  const user = await requireRole("admin");
  const complaints = await db.listComplaints(user.society_id);
  const open = complaints.filter((c) => c.status === "open");
  const resolved = complaints.filter((c) => c.status === "resolved");

  return (
    <div>
      <PageHeader title="Complaints" description="Tickets raised by residents — keep the open queue close to zero." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title={`Open (${open.length})`} />
          <CardBody>
            {open.length === 0 ? (
              <EmptyState title="Inbox zero" hint="No open complaints." />
            ) : (
              <ul className="divide-y divide-slate-100">
                {open.map((c) => (
                  <li key={c.id} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900">{c.category}</span>
                        <Badge tone="amber">open</Badge>
                      </div>
                      <div className="mt-0.5 text-xs text-slate-500">
                        Flat {c.flat?.block}-{c.flat?.number} · {new Date(c.created_at).toLocaleDateString("en-IN")}
                      </div>
                      <div className="mt-1 text-sm text-slate-700">{c.description}</div>
                      {c.photo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={c.photo_url} alt="Complaint" className="mt-2 max-h-40 rounded border border-slate-200" />
                      ) : null}
                    </div>
                    <form action={resolveAction}>
                      <input type="hidden" name="id" value={c.id} />
                      <Button variant="secondary" type="submit">
                        Mark resolved
                      </Button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title={`Resolved (${resolved.length})`} />
          <CardBody>
            {resolved.length === 0 ? (
              <EmptyState title="Nothing here yet" />
            ) : (
              <ul className="divide-y divide-slate-100">
                {resolved.map((c) => (
                  <li key={c.id} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900">{c.category}</span>
                      <Badge tone="green">resolved</Badge>
                    </div>
                    <div className="mt-0.5 text-xs text-slate-500">
                      Flat {c.flat?.block}-{c.flat?.number} ·{" "}
                      {c.resolved_at ? new Date(c.resolved_at).toLocaleDateString("en-IN") : ""}
                    </div>
                    <div className="mt-1 text-sm text-slate-600">{c.description}</div>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

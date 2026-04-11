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
              <ul className="space-y-3">
                {open.map((c) => (
                  <li key={c.id} className="rounded-lg border border-slate-700/50 bg-slate-800/40 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-900 dark:text-white">{c.category}</span>
                          <span className="inline-flex items-center rounded-full border border-orange-500/20 bg-orange-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-orange-500">open</span>
                        </div>
                        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          Flat {c.flat?.block}-{c.flat?.number} · {new Date(c.created_at).toLocaleDateString("en-IN")}
                        </div>
                        <div className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">{c.description}</div>
                        {c.photo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={c.photo_url} alt="Complaint" className="mt-3 max-h-40 rounded-lg border border-slate-700/50" />
                        ) : null}
                      </div>
                      <form action={resolveAction} className="shrink-0">
                        <input type="hidden" name="id" value={c.id} />
                        <Button variant="secondary" type="submit" className="border-slate-300 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700">
                          Mark resolved
                        </Button>
                      </form>
                    </div>
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
              <ul className="space-y-3">
                {resolved.map((c) => (
                  <li key={c.id} className="rounded-lg border border-slate-700/30 bg-slate-800/20 p-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900 dark:text-slate-200">{c.category}</span>
                      <span className="inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400">resolved</span>
                    </div>
                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Flat {c.flat?.block}-{c.flat?.number} ·{" "}
                      {c.resolved_at ? new Date(c.resolved_at).toLocaleDateString("en-IN") : ""}
                    </div>
                    <div className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{c.description}</div>
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

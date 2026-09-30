import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardBody, CardHeader, Button, Input, Label, EmptyState, Badge } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { PageHeader } from "@/components/nav";

interface PageProps {
  searchParams: { code?: string; status?: string };
}

async function lookupAction(formData: FormData) {
  "use server";
  await requireRole("guard");
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  redirect(`/guard?code=${encodeURIComponent(code)}`);
}

async function admitAction(formData: FormData) {
  "use server";
  const user = await requireRole("guard");
  const id = String(formData.get("id") ?? "");
  if (id) await db.markVisitorEntered(id, user.society_id);
  revalidatePath("/guard");
  redirect("/guard");
}

export default async function GuardGatePage({ searchParams }: PageProps) {
  const user = await requireRole("guard");
  const code = searchParams.code?.toUpperCase() ?? "";
  const visitor = code ? await db.findVisitorByCode(code, user.society_id) : undefined;
  const flat = visitor ? await db.getFlat(visitor.flat_id) : undefined;
  const allVisitors = await db.listVisitorsForSociety(user.society_id);
  const recent = allVisitors.filter((v) => v.status === "entered").slice(0, 8);

  return (
    <div>
      <PageHeader
        title="Main gate"
        description="Type the visitor's entry code. The system tells you which flat invited them."
      />

      <Card className="mb-6">
        <CardHeader title="Lookup entry code" />
        <CardBody>
          <form action={lookupAction} className="flex flex-wrap items-end gap-3">
            <div className="min-w-[200px]">
              <Label htmlFor="code">Entry code</Label>
              <Input id="code" name="code" required autoFocus className="font-mono uppercase tracking-widest" defaultValue={code} />
            </div>
            <SubmitButton loadingText="Looking up..." className="w-auto">Look up</SubmitButton>
          </form>

          {code && !visitor ? (
            <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
              Code <span className="font-mono font-bold">{code}</span> is not recognized for this society. Do not allow entry.
            </div>
          ) : null}

          {visitor ? (
            <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950/40">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-lg font-semibold text-emerald-900 dark:text-emerald-300">{visitor.name}</div>
                  <div className="text-sm text-emerald-800 dark:text-emerald-400">
                    Visiting Flat {flat?.block}-{flat?.number} · {visitor.purpose}
                  </div>
                  <div className="mt-1 text-xs text-emerald-700 dark:text-emerald-500">Expected on {visitor.expected_on}</div>
                </div>
                {visitor.status === "entered" ? (
                  <Badge tone="green">already entered</Badge>
                ) : (
                  <form action={admitAction}>
                    <input type="hidden" name="id" value={visitor.id} />
                    <SubmitButton loadingText="Admitting..." className="w-auto">Admit visitor</SubmitButton>
                  </form>
                )}
              </div>
            </div>
          ) : null}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Recently admitted" />
        <CardBody>
          {recent.length === 0 ? (
            <EmptyState title="No entries yet today" />
          ) : (
            <ul className="space-y-3">
              {recent.map((v) => (
                <li key={v.id} className="flex items-center justify-between border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900/50 p-4">
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">{v.name}</div>
                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Flat {v.flat?.block}-{v.flat?.number} · {v.purpose}
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {v.entered_at ? new Date(v.entered_at).toLocaleTimeString("en-IN") : ""}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

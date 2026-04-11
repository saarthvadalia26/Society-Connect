import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardBody, CardHeader, Button, Input, Label, Badge, EmptyState } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { PageHeader } from "@/components/nav";

async function inviteAction(formData: FormData) {
  "use server";
  const user = await requireRole("resident");
  if (!user.flat_id) return;
  const name = String(formData.get("name") ?? "").trim();
  const purpose = String(formData.get("purpose") ?? "").trim();
  const expected_on = String(formData.get("expected_on") ?? "");
  if (!name || !purpose || !expected_on) return;
  await db.createVisitor({ flat_id: user.flat_id, name, purpose, expected_on });
  revalidatePath("/resident/visitors");
  redirect("/resident/visitors");
}

export default async function ResidentVisitorsPage() {
  const user = await requireRole("resident");
  const visitors = user.flat_id ? await db.listVisitorsForFlat(user.flat_id) : [];

  return (
    <div>
      <PageHeader
        title="Guest invites"
        description="Pre-approve visitors with a unique entry code. Share the code on WhatsApp — your guest shows it at the gate."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader title="Invite a guest" />
          <CardBody>
            <form action={inviteAction} className="space-y-3">
              <div>
                <Label htmlFor="name">Guest name</Label>
                <Input id="name" name="name" required />
              </div>
              <div>
                <Label htmlFor="purpose">Purpose</Label>
                <Input id="purpose" name="purpose" required placeholder="e.g. Friend visit, Delivery" />
              </div>
              <div>
                <Label htmlFor="expected_on">Expected date</Label>
                <Input id="expected_on" name="expected_on" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} />
              </div>
              <SubmitButton loadingText="Generating...">Generate code</SubmitButton>
            </form>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title={`My invites (${visitors.length})`} />
          <CardBody>
            {visitors.length === 0 ? (
              <EmptyState title="No invites yet" hint="Generate one above." />
            ) : (
              <ul className="divide-y divide-slate-100">
                {visitors.map((v) => {
                  const waText = encodeURIComponent(
                    `Hi ${v.name}, your entry code for our society is ${v.entry_code}. Please show this to the security guard at the gate on ${v.expected_on}.`,
                  );
                  return (
                    <li key={v.id} className="flex items-start justify-between gap-3 py-4 first:pt-0 last:pb-0 border-b border-slate-800/50 last:border-0 hover:bg-slate-800/10 transition-colors">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="!text-lg !font-bold" style={{ color: '#ffffff', opacity: 1 }}>{v.name}</span>
                          {v.status === "entered" ? (
                            <Badge tone="green">entered</Badge>
                          ) : (
                            <Badge tone="amber">awaiting entry</Badge>
                          )}
                        </div>
                        <div className="mt-0.5 text-xs !text-[#cbd5e1] opacity-100" style={{ color: '#cbd5e1' }}>
                          {v.purpose} · expected {v.expected_on}
                        </div>
                        <div className="mt-2 inline-block rounded border border-slate-700 bg-slate-800 px-2 py-1 font-mono text-xs tracking-widest text-white">
                          {v.entry_code}
                        </div>
                        {v.entered_at ? (
                          <div className="mt-1 text-[11px] !text-[#94a3b8]" style={{ color: '#94a3b8' }}>
                            Entered {new Date(v.entered_at).toLocaleString("en-IN")}
                          </div>
                        ) : null}
                      </div>
                      {v.status !== "entered" ? (
                        <a
                          href={`https://wa.me/?text=${waText}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-700"
                        >
                          Share on WhatsApp
                        </a>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

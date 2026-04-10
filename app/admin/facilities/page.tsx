import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { db, fmtINR } from "@/lib/db";
import { supabaseServer } from "@/lib/supabase";
import { Card, CardBody, CardHeader, Button, Input, Label, Textarea, Badge, EmptyState } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { PageHeader } from "@/components/nav";

async function addFacilityAction(formData: FormData) {
  "use server";
  const user = await requireRole("admin");
  const name = String(formData.get("name") ?? "").trim();
  const fee = Number(formData.get("fee") ?? 0);
  const description = String(formData.get("description") ?? "").trim() || null;
  if (!name || !fee) return;
  await supabaseServer().from("facilities").insert({
    society_id: user.society_id,
    name,
    fee,
    description,
  });
  revalidatePath("/admin/facilities");
  redirect("/admin/facilities");
}

async function removeFacilityAction(formData: FormData) {
  "use server";
  await requireRole("admin");
  const id = String(formData.get("id") ?? "");
  if (id) await supabaseServer().from("facilities").delete().eq("id", id);
  revalidatePath("/admin/facilities");
  redirect("/admin/facilities");
}

async function decideAction(formData: FormData) {
  "use server";
  await requireRole("admin");
  const id = String(formData.get("id") ?? "");
  const decision = String(formData.get("decision") ?? "") as "approved" | "rejected";
  if (id && (decision === "approved" || decision === "rejected")) {
    await db.decideBooking(id, decision);
  }
  revalidatePath("/admin/facilities");
  redirect("/admin/facilities");
}

export default async function AdminFacilitiesPage() {
  const user = await requireRole("admin");
  const [facilities, bookings] = await Promise.all([
    db.listFacilities(user.society_id),
    db.listBookings(user.society_id),
  ]);
  const pending = bookings.filter((b) => b.status === "requested");
  const decided = bookings.filter((b) => b.status !== "requested");

  return (
    <div>
      <PageHeader
        title="Facility bookings"
        description="Approve clubhouse and pool requests. Approved fees roll into the next maintenance bill automatically."
      />

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader title="Add a facility" />
          <CardBody>
            <form action={addFacilityAction} className="space-y-3">
              <div>
                <Label htmlFor="fname">Name</Label>
                <Input id="fname" name="name" required placeholder="e.g. Clubhouse" />
              </div>
              <div>
                <Label htmlFor="fee">Fee per booking (₹)</Label>
                <Input id="fee" name="fee" type="number" min={0} required />
              </div>
              <div>
                <Label htmlFor="fdesc">Description (optional)</Label>
                <Textarea id="fdesc" name="description" rows={2} placeholder="e.g. Air-conditioned hall, capacity 60." />
              </div>
              <SubmitButton loadingText="Adding...">Add</SubmitButton>
            </form>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title={`Facilities (${facilities.length})`} />
          <CardBody>
            {facilities.length === 0 ? (
              <EmptyState title="No facilities yet" hint="Add one using the form." />
            ) : (
              <ul className="divide-y divide-slate-100">
                {facilities.map((f) => (
                  <li key={f.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{f.name}</div>
                      {f.description ? <div className="text-xs text-slate-500">{f.description}</div> : null}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone="blue">{fmtINR(f.fee)} / booking</Badge>
                      <form action={removeFacilityAction}>
                        <input type="hidden" name="id" value={f.id} />
                        <Button variant="ghost" type="submit">Remove</Button>
                      </form>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader title={`Pending requests (${pending.length})`} />
        <CardBody>
          {pending.length === 0 ? (
            <EmptyState title="No pending requests" />
          ) : (
            <ul className="divide-y divide-slate-100">
              {pending.map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      {b.facility?.name} · {b.date}
                    </div>
                    <div className="text-xs text-slate-500">
                      Flat {b.flat?.block}-{b.flat?.number} · fee {fmtINR(b.facility?.fee ?? 0)}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <form action={decideAction}>
                      <input type="hidden" name="id" value={b.id} />
                      <input type="hidden" name="decision" value="approved" />
                      <Button type="submit">Approve</Button>
                    </form>
                    <form action={decideAction}>
                      <input type="hidden" name="id" value={b.id} />
                      <input type="hidden" name="decision" value="rejected" />
                      <Button variant="secondary" type="submit">
                        Reject
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
        <CardHeader title={`Decided (${decided.length})`} />
        <CardBody>
          {decided.length === 0 ? (
            <EmptyState title="Nothing decided yet" />
          ) : (
            <ul className="divide-y divide-slate-100">
              {decided.map((b) => (
                <li key={b.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      {b.facility?.name} · {b.date}
                    </div>
                    <div className="text-xs text-slate-500">
                      Flat {b.flat?.block}-{b.flat?.number}
                      {b.fee_billed ? " · fee billed" : ""}
                    </div>
                  </div>
                  {b.status === "approved" ? <Badge tone="green">approved</Badge> : <Badge tone="red">rejected</Badge>}
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

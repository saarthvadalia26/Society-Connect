import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { db, fmtCurrency } from "@/lib/db";
import { supabaseServer } from "@/lib/supabase";
import { Card, CardBody, CardHeader, Button, Input, Label, Textarea, Badge, EmptyState } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { PageHeader } from "@/components/nav";

function calcDuration(start: string | undefined, end: string | undefined) {
  if (!start || !end) return 1;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const startH = sh + sm / 60;
  const endH = eh + em / 60;
  return Math.max(1, Math.ceil(endH - startH));
}

async function addFacilityAction(formData: FormData) {
  "use server";
  const user = await requireRole("admin");
  const name = String(formData.get("name") ?? "").trim();
  const fee = Number(formData.get("fee") ?? 0);
  const description = String(formData.get("description") ?? "").trim() || null;
  if (!name || !fee) {
    redirect("/admin/facilities?error=" + encodeURIComponent("Name and fee are required."));
  }

  // Case-insensitive duplicate check within this society
  const { data: existing } = await supabaseServer()
    .from("facilities")
    .select("id")
    .eq("society_id", user.society_id)
    .ilike("name", name)
    .maybeSingle();

  if (existing) {
    redirect("/admin/facilities?error=" + encodeURIComponent(`A facility named "${name}" already exists in your society.`));
  }

  await supabaseServer().from("facilities").insert({
    society_id: user.society_id,
    name,
    fee,
    description,
  });
  revalidatePath("/admin/facilities");
  redirect("/admin/facilities?success=" + encodeURIComponent(`"${name}" added successfully.`));
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

export default async function AdminFacilitiesPage({ searchParams }: { searchParams: { error?: string; success?: string } }) {
  const user = await requireRole("admin");
  const errorMsg = searchParams.error;
  const successMsg = searchParams.success;
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

      {/* Success / Error banners */}
      {successMsg && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-400">
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-400">
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {errorMsg}
        </div>
      )}

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
                <Label htmlFor="fee">Fee per hour (₹)</Label>
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
              <ul className="space-y-2">
                {facilities.map((f) => (
                  <li key={f.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-700/50 bg-slate-800/40 px-4 py-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">{f.name}</div>
                      {f.description ? <div className="text-xs text-slate-500 dark:text-slate-400">{f.description}</div> : null}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center rounded-full border border-blue-500/30 bg-blue-600/20 px-2.5 py-0.5 text-[11px] font-semibold text-blue-400">{fmtCurrency(f.fee, user.currency)} / hour</span>
                      <form action={removeFacilityAction}>
                        <input type="hidden" name="id" value={f.id} />
                        <Button variant="ghost" type="submit" className="text-slate-400 hover:text-red-400 dark:text-slate-500 dark:hover:text-red-400">Remove</Button>
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
            <ul className="space-y-2">
              {pending.map((b) => {
                const duration = calcDuration(b.start_time, b.end_time);
                const totalFee = (b.facility?.fee ?? 0) * duration;
                return (
                <li key={b.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-700/50 bg-slate-800/40 px-4 py-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">
                      {b.facility?.name} · {b.date} ({b.start_time} - {b.end_time})
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Flat {b.flat?.block}-{b.flat?.number} · fee {fmtCurrency(totalFee, user.currency)} ({duration} hr)
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
                      <Button variant="secondary" type="submit" className="dark:border-slate-600 dark:text-slate-200">
                        Reject
                      </Button>
                    </form>
                  </div>
                </li>
              )})}
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
            <ul className="space-y-2">
              {decided.map((b) => (
                <li key={b.id} className="flex items-center justify-between rounded-lg border border-slate-700/30 bg-slate-800/20 px-4 py-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-200">
                      {b.facility?.name} · {b.date} ({b.start_time} - {b.end_time})
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Flat {b.flat?.block}-{b.flat?.number}
                      {b.fee_billed ? " · fee billed" : ""}
                    </div>
                  </div>
                  {b.status === "approved"
                    ? <span className="inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400">approved</span>
                    : <span className="inline-flex items-center rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-red-400">rejected</span>
                  }
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

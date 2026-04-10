import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { db, fmtINR } from "@/lib/db";
import { Card, CardBody, CardHeader, Button, Label, Input, Badge, EmptyState } from "@/components/ui";
import { PageHeader } from "@/components/nav";

async function requestBookingAction(formData: FormData) {
  "use server";
  const user = await requireRole("resident");
  if (!user.flat_id) return;
  const facility_id = String(formData.get("facility_id") ?? "");
  const date = String(formData.get("date") ?? "");
  if (!facility_id || !date) return;
  await db.requestBooking({ facility_id, flat_id: user.flat_id, date });
  revalidatePath("/resident/facilities");
  redirect("/resident/facilities");
}

function nextDays(n = 30): { date: string; iso: string }[] {
  const out: { date: string; iso: string }[] = [];
  const today = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    out.push({ iso, date: d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }) });
  }
  return out;
}

export default async function ResidentFacilitiesPage() {
  const user = await requireRole("resident");
  const [facilities, myBookings, allBookings] = await Promise.all([
    db.listFacilities(user.society_id),
    user.flat_id ? db.listBookingsForFlat(user.flat_id) : Promise.resolve([]),
    db.listBookings(user.society_id),
  ]);

  // Build a quick "is taken" map for the next 30 days per facility.
  const days = nextDays(30);
  const taken = new Map<string, Set<string>>();
  for (const f of facilities) taken.set(f.id, new Set());
  for (const b of allBookings) {
    if (b.status === "rejected") continue;
    taken.get(b.facility_id)?.add(b.date);
  }

  return (
    <div>
      <PageHeader
        title="Book a facility"
        description="Reserve the clubhouse or pool for a private slot. The fee is added to your next maintenance bill."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {facilities.map((f) => (
          <Card key={f.id}>
            <CardHeader title={f.name} subtitle={f.description ?? undefined} />
            <CardBody>
              <div className="mb-3 text-xs text-slate-500">Fee: {fmtINR(f.fee)}</div>
              <form action={requestBookingAction} className="flex flex-wrap items-end gap-3">
                <input type="hidden" name="facility_id" value={f.id} />
                <div>
                  <Label htmlFor={`date-${f.id}`}>Date</Label>
                  <Input id={`date-${f.id}`} name="date" type="date" required />
                </div>
                <Button type="submit">Request booking</Button>
              </form>
              <div className="mt-4">
                <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Next 14 days</div>
                <div className="flex flex-wrap gap-1">
                  {days.slice(0, 14).map((d) => {
                    const isTaken = taken.get(f.id)?.has(d.iso);
                    return (
                      <span
                        key={d.iso}
                        className={`rounded px-2 py-0.5 text-[11px] ${
                          isTaken ? "bg-red-100 text-red-700 line-through" : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {d.date}
                      </span>
                    );
                  })}
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader title={`My bookings (${myBookings.length})`} />
        <CardBody>
          {myBookings.length === 0 ? (
            <EmptyState title="No bookings yet" />
          ) : (
            <ul className="divide-y divide-slate-100">
              {myBookings.map((b) => (
                <li key={b.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      {b.facility?.name} · {b.date}
                    </div>
                    <div className="text-xs text-slate-500">
                      {b.facility ? `${fmtINR(b.facility.fee)} fee` : ""}
                      {b.fee_billed ? " · billed" : ""}
                    </div>
                  </div>
                  {b.status === "approved" ? (
                    <Badge tone="green">approved</Badge>
                  ) : b.status === "rejected" ? (
                    <Badge tone="red">rejected</Badge>
                  ) : (
                    <Badge tone="amber">pending</Badge>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

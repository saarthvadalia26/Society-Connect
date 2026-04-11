import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { db, fmtCurrency } from "@/lib/db";
import { Card, CardBody, CardHeader, Badge, EmptyState } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { BookingForm } from "./booking-form";
import { PageHeader } from "@/components/nav";

async function requestBookingAction(formData: FormData) {
  "use server";
  const user = await requireRole("resident");
  if (!user.flat_id) return;
  const facility_id = String(formData.get("facility_id") ?? "");
  const date = String(formData.get("date") ?? "");
  const start_time = String(formData.get("start_time") ?? "");
  const end_time = String(formData.get("end_time") ?? "");
  
  if (!facility_id || !date || !start_time || !end_time) return;
  const success = await db.requestBooking({ facility_id, flat_id: user.flat_id, date, start_time, end_time });
  
  if (!success) {
    redirect("/resident/facilities?error=" + encodeURIComponent("Time slot overlaps with an existing booking."));
  }
  
  revalidatePath("/resident/facilities");
  redirect("/resident/facilities?success=" + encodeURIComponent("Booking requested successfully."));
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

export default async function ResidentFacilitiesPage({ searchParams }: { searchParams: { error?: string; success?: string } }) {
  const user = await requireRole("resident");
  const errorMsg = searchParams.error;
  const successMsg = searchParams.success;
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
        description="Reserve the clubhouse or pool for a private slot. The fee is calculated by the hour and added to your next maintenance bill."
      />

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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {facilities.map((f) => (
          <Card key={f.id}>
            <CardHeader title={f.name} subtitle={f.description ?? undefined} />
            <CardBody>
              <div className="mb-5 text-[13px] text-slate-500 dark:text-slate-300">
                <span className="font-semibold text-slate-900 dark:text-white">{fmtCurrency(f.fee, user.currency)} / hour</span>
              </div>
              <form action={requestBookingAction} className="flex flex-col gap-4">
                <BookingForm facilityId={f.id} fee={f.fee} currency={user.currency} />
                <div className="self-end">
                  <SubmitButton loadingText="Requesting...">Request booking</SubmitButton>
                </div>
              </form>
              <div className="mt-6">
                <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Next 14 days</div>
                <div className="flex flex-wrap gap-1">
                  {days.slice(0, 14).map((d) => {
                    const isTaken = taken.get(f.id)?.has(d.iso);
                    return (
                      <span
                        key={d.iso}
                        className={`rounded px-2 py-0.5 text-[11px] ${
                          isTaken 
                            ? "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400" 
                            : "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
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
            <ul className="space-y-2">
              {myBookings.map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-700/30 bg-slate-800/20 px-4 py-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">
                      {b.facility?.name} · {b.date} ({b.start_time} - {b.end_time})
                    </div>
                    <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      {b.fee_billed ? "fee billed" : "unbilled"}
                    </div>
                  </div>
                  {b.status === "approved" ? (
                    <span className="inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400">approved</span>
                  ) : b.status === "rejected" ? (
                    <span className="inline-flex items-center rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-red-400">rejected</span>
                  ) : (
                    <span className="inline-flex items-center rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-400">pending</span>
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

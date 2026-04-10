import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardBody, CardHeader, Button, Input, Label, Textarea, Badge, EmptyState } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { PageHeader } from "@/components/nav";

const CATEGORIES = ["Plumbing", "Electrical", "Security", "Parking", "Lift", "Cleanliness", "Other"];

async function raiseAction(formData: FormData) {
  "use server";
  const user = await requireRole("resident");
  if (!user.flat_id) return;
  const category = String(formData.get("category") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (!category || !description) return;

  // Skip photo base64 conversion — it was the main bottleneck.
  // Photo upload will be via Supabase Storage in a future update.
  const photo = formData.get("photo") as File | null;
  let photo_url: string | null = null;
  if (photo && photo.size > 0 && photo.size < 500_000) {
    // Only inline tiny images (<500KB) to keep it fast
    const buf = Buffer.from(await photo.arrayBuffer());
    photo_url = `data:${photo.type};base64,${buf.toString("base64")}`;
  }

  await db.addComplaint({ flat_id: user.flat_id, category, description, photo_url });
  revalidatePath("/resident/complaints");
  redirect("/resident/complaints");
}

export default async function ResidentComplaintsPage() {
  const user = await requireRole("resident");
  const complaints = user.flat_id ? await db.listComplaintsForFlat(user.flat_id) : [];

  return (
    <div>
      <PageHeader title="Help desk" description="Raise tickets for plumbing, electrical, parking, or any society issue." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader title="Raise a ticket" />
          <CardBody>
            <form action={raiseAction} className="space-y-3" encType="multipart/form-data">
              <div>
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  name="category"
                  required
                  defaultValue=""
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  <option value="" disabled>
                    Select a category
                  </option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" rows={4} required placeholder="What's the issue?" />
              </div>
              <div>
                <Label htmlFor="photo">Photo (optional, &lt; 2 MB)</Label>
                <input
                  id="photo"
                  name="photo"
                  type="file"
                  accept="image/*"
                  className="block text-xs text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-brand-600 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white hover:file:bg-brand-700"
                />
              </div>
              <SubmitButton loadingText="Submitting...">Submit ticket</SubmitButton>
            </form>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title={`My tickets (${complaints.length})`} />
          <CardBody>
            {complaints.length === 0 ? (
              <EmptyState title="No tickets yet" hint="Use the form to raise one." />
            ) : (
              <ul className="divide-y divide-slate-100">
                {complaints.map((c) => (
                  <li key={c.id} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-slate-900">{c.category}</div>
                      {c.status === "open" ? <Badge tone="amber">open</Badge> : <Badge tone="green">resolved</Badge>}
                    </div>
                    <div className="mt-1 text-sm text-slate-700">{c.description}</div>
                    {c.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.photo_url} alt="Complaint" className="mt-2 max-h-40 rounded border border-slate-200" />
                    ) : null}
                    <div className="mt-1 text-[11px] text-slate-400">
                      Raised {new Date(c.created_at).toLocaleDateString("en-IN")}
                      {c.resolved_at ? ` · resolved ${new Date(c.resolved_at).toLocaleDateString("en-IN")}` : ""}
                    </div>
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

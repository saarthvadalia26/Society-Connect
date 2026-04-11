import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardBody, CardHeader, Button, Input, Label, Textarea, EmptyState, Badge } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { PageHeader } from "@/components/nav";

async function addContactAction(formData: FormData) {
  "use server";
  const user = await requireRole("admin");
  const name = String(formData.get("name") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const rating = Math.min(5, Math.max(1, Number(formData.get("rating") ?? 5)));
  const notes = String(formData.get("notes") ?? "").trim() || null;
  if (!name || !role || !phone) return;
  await db.addContact({ society_id: user.society_id, name, role, phone, rating, notes });
  revalidatePath("/admin/contacts");
  redirect("/admin/contacts");
}

async function deleteContactAction(formData: FormData) {
  "use server";
  await requireRole("admin");
  const id = String(formData.get("id") ?? "");
  if (id) await db.removeContact(id);
  revalidatePath("/admin/contacts");
  redirect("/admin/contacts");
}

export default async function AdminContactsPage() {
  const user = await requireRole("admin");
  const contacts = await db.listContacts(user.society_id);

  return (
    <div>
      <PageHeader
        title="Trusted contacts"
        description="Vetted local service providers — already cleared by the gate. Residents see this directory in their portal."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader title="Add contact" />
          <CardBody>
            <form action={addContactAction} className="space-y-3">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" required />
              </div>
              <div>
                <Label htmlFor="role">Role / trade</Label>
                <Input id="role" name="role" required placeholder="e.g. Plumber" />
              </div>
              <div>
                <Label htmlFor="phone">Phone (with country code)</Label>
                <Input id="phone" name="phone" required placeholder="+919812345678" />
              </div>
              <div>
                <Label htmlFor="rating">Rating (1–5)</Label>
                <Input id="rating" name="rating" type="number" min={1} max={5} defaultValue={5} required />
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" name="notes" rows={2} />
              </div>
              <SubmitButton loadingText="Adding...">Add</SubmitButton>
            </form>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title={`Directory (${contacts.length})`} />
          <CardBody>
            {contacts.length === 0 ? (
              <EmptyState title="No contacts yet" hint="Add your first vetted vendor." />
            ) : (
              <ul className="space-y-3">
                {contacts.map((c) => (
                  <li key={c.id} className="rounded-lg border border-slate-700/50 bg-slate-800/40 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-base font-bold text-slate-900 dark:text-white">{c.name}</span>
                          <span className="inline-flex items-center rounded-full border border-blue-500/30 bg-blue-600/20 px-2.5 py-0.5 text-[11px] font-semibold text-blue-400">{c.role}</span>
                          <span className="text-sm text-yellow-500" title={`${c.rating}/5`}>{"★".repeat(c.rating)}{"☆".repeat(5 - c.rating)}</span>
                        </div>
                        <div className="mt-1.5 text-sm font-medium text-slate-700 dark:text-slate-200">{c.phone}</div>
                        {c.notes ? <div className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{c.notes}</div> : null}
                      </div>
                      <form action={deleteContactAction} className="shrink-0">
                        <input type="hidden" name="id" value={c.id} />
                        <Button variant="ghost" type="submit" className="text-slate-400 hover:text-red-400 dark:text-slate-500 dark:hover:text-red-400">
                          Remove
                        </Button>
                      </form>
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

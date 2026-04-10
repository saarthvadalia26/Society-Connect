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
              <ul className="divide-y divide-slate-100">
                {contacts.map((c) => (
                  <li key={c.id} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900">{c.name}</span>
                        <Badge tone="blue">{c.role}</Badge>
                        <span className="text-xs text-amber-600">{"★".repeat(c.rating)}</span>
                      </div>
                      <div className="mt-0.5 text-xs text-slate-500">{c.phone}</div>
                      {c.notes ? <div className="mt-1 text-xs text-slate-600">{c.notes}</div> : null}
                    </div>
                    <form action={deleteContactAction}>
                      <input type="hidden" name="id" value={c.id} />
                      <Button variant="ghost" type="submit">
                        Remove
                      </Button>
                    </form>
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

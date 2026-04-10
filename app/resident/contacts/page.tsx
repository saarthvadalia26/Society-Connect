import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardBody, CardHeader, EmptyState, Badge } from "@/components/ui";
import { PageHeader } from "@/components/nav";

function callHref(phone: string) {
  return `tel:${phone.replace(/\s+/g, "")}`;
}

function whatsappHref(phone: string) {
  const digits = phone.replace(/[^\d]/g, "");
  return `https://wa.me/${digits}`;
}

export default async function ResidentContactsPage() {
  const user = await requireRole("resident");
  const contacts = await db.listContacts(user.society_id);
  const grouped = new Map<string, typeof contacts>();
  for (const c of contacts) {
    if (!grouped.has(c.role)) grouped.set(c.role, []);
    grouped.get(c.role)!.push(c);
  }

  return (
    <div>
      <PageHeader
        title="Trusted contacts"
        description="Vetted plumbers, electricians, and more — already cleared by your society."
      />
      {contacts.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState title="No contacts yet" hint="Ask the management committee to add some." />
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-6">
          {Array.from(grouped.entries()).map(([role, list]) => (
            <Card key={role}>
              <CardHeader title={role} />
              <CardBody>
                <ul className="divide-y divide-slate-100">
                  {list.map((c) => (
                    <li key={c.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-900">{c.name}</span>
                          <span className="text-xs text-amber-600">{"★".repeat(c.rating)}</span>
                        </div>
                        <div className="mt-0.5 text-xs text-slate-500">{c.phone}</div>
                        {c.notes ? <div className="mt-1 text-xs text-slate-600">{c.notes}</div> : null}
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={callHref(c.phone)}
                          className="rounded-md bg-brand-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-brand-700"
                        >
                          Call
                        </a>
                        <a
                          href={whatsappHref(c.phone)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-700"
                        >
                          WhatsApp
                        </a>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

import { redirect } from "next/navigation";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardBody, CardHeader, Badge } from "@/components/ui";
import { PageHeader } from "@/components/nav";

export default async function OnboardingPage() {
  const user = await requireRole("admin");
  const [flats, facilities, contacts, users] = await Promise.all([
    db.listFlats(user.society_id),
    db.listFacilities(user.society_id),
    db.listContacts(user.society_id),
    db.listUsers(user.society_id),
  ]);
  const residents = users.filter((u) => u.role === "resident");
  const guards = users.filter((u) => u.role === "guard");

  const steps = [
    {
      title: "1. Add your flats",
      description: "Upload a CSV with block + flat numbers, or add them from the Flats page.",
      href: "/admin/flats",
      done: flats.length > 0,
      count: `${flats.length} flats`,
    },
    {
      title: "2. Add residents",
      description: "Create accounts for homeowners so they can sign in, pay bills, and raise tickets.",
      href: "/admin/members",
      done: residents.length > 0,
      count: `${residents.length} residents`,
    },
    {
      title: "3. Add security guard(s)",
      description: "Give your gate guard a login so they can verify visitor entry codes.",
      href: "/admin/members",
      done: guards.length > 0,
      count: `${guards.length} guards`,
    },
    {
      title: "4. Set up facilities",
      description: "Add bookable facilities like clubhouse, pool, or gym with their fees.",
      href: "/admin/facilities",
      done: facilities.length > 0,
      count: `${facilities.length} facilities`,
    },
    {
      title: "5. Add trusted contacts",
      description: "Add vetted plumbers, electricians, and other service providers for your residents.",
      href: "/admin/contacts",
      done: contacts.length > 0,
      count: `${contacts.length} contacts`,
    },
    {
      title: "6. Post your first notice",
      description: "Let residents know the society portal is live!",
      href: "/admin/notices",
      done: false,
      count: "",
    },
  ];

  const completed = steps.filter((s) => s.done).length;
  const allDone = completed >= 5; // 5 of 6 (notice is optional)

  return (
    <div>
      <PageHeader
        title="Set up your society"
        description={allDone
          ? "You're all set! Head to the dashboard to start managing."
          : `Complete these steps to get your society portal running. ${completed} of ${steps.length} done.`
        }
      />

      {allDone ? (
        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-center">
          <div className="text-lg font-semibold text-emerald-900">Setup complete!</div>
          <p className="mt-1 text-sm text-emerald-700">
            Your society is ready. Residents can sign in and start using the portal.
          </p>
          <Link
            href="/admin"
            className="mt-3 inline-block rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Go to dashboard →
          </Link>
        </div>
      ) : null}

      <div className="space-y-3">
        {steps.map((step) => (
          <Link key={step.title} href={step.href}>
            <Card className="transition hover:border-brand-400 hover:shadow-md">
              <CardBody className="flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900">{step.title}</span>
                    {step.done ? (
                      <Badge tone="green">Done</Badge>
                    ) : (
                      <Badge tone="amber">To do</Badge>
                    )}
                  </div>
                  <div className="mt-0.5 text-xs text-slate-500">{step.description}</div>
                  {step.count && step.done ? (
                    <div className="mt-1 text-[11px] text-slate-400">{step.count}</div>
                  ) : null}
                </div>
                <span className="text-xs text-brand-600">Open →</span>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

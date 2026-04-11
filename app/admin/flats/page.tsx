import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Papa from "papaparse";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardBody, CardHeader, Button, Badge, EmptyState } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { PageHeader } from "@/components/nav";

interface CsvRow {
  block?: string;
  Block?: string;
  number?: string;
  Number?: string;
  flat?: string;
  Flat?: string;
  ownerEmail?: string;
  email?: string;
  Email?: string;
  ownerName?: string;
  name?: string;
  Name?: string;
}

async function uploadCsvAction(formData: FormData) {
  "use server";
  const user = await requireRole("admin");
  const file = formData.get("csv") as File | null;
  if (!file || file.size === 0) return;
  const text = await file.text();
  const parsed = Papa.parse<CsvRow>(text, { header: true, skipEmptyLines: true });
  const rows = parsed.data
    .map((r) => ({
      block: String(r.block ?? r.Block ?? "").trim(),
      number: String(r.number ?? r.Number ?? r.flat ?? r.Flat ?? "").trim(),
      ownerEmail: String(r.ownerEmail ?? r.email ?? r.Email ?? "").trim() || undefined,
      ownerName: String(r.ownerName ?? r.name ?? r.Name ?? "").trim() || undefined,
    }))
    .filter((r) => r.block && r.number);
  await db.addFlats(rows, user.society_id);
  revalidatePath("/admin/flats");
  redirect("/admin/flats");
}

export default async function AdminFlatsPage() {
  const user = await requireRole("admin");
  const [flats, owners] = await Promise.all([
    db.listFlats(user.society_id),
    db.listUsers(user.society_id),
  ]);
  const ownerById = new Map(owners.map((u) => [u.id, u] as const));

  return (
    <div>
      <PageHeader title="Flats" description="Onboard your society once via CSV — these flats power the billing cycle." />

      <Card>
        <CardHeader title="Bulk onboarding" subtitle='CSV columns: block, number, ownerEmail, ownerName (last two optional)' />
        <CardBody>
          <form action={uploadCsvAction} className="flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">CSV file</label>
              <input
                type="file"
                name="csv"
                accept=".csv,text/csv"
                required
                className="block text-sm text-slate-700 dark:text-slate-400 file:mr-3 file:rounded-md file:border-0 file:bg-brand-600 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white hover:file:bg-brand-700"
              />
            </div>
            <SubmitButton loadingText="Uploading...">Upload</SubmitButton>
          </form>
          <details className="mt-4 text-xs text-slate-400">
            <summary className="cursor-pointer font-medium text-blue-400 hover:text-blue-300 transition-colors">Sample CSV</summary>
            <pre className="mt-2 rounded-md bg-slate-100 dark:bg-slate-800 p-3 text-[11px] leading-relaxed text-slate-700 dark:text-slate-300">{`block,number,ownerName,ownerEmail
A,103,Meera Joshi,meera@example.com
A,104,Arjun Rao,arjun@example.com
D,401,,`}</pre>
          </details>
        </CardBody>
      </Card>

      <Card className="mt-6">
        <CardHeader title={`All flats (${flats.length})`} />
        <CardBody>
          {flats.length === 0 ? (
            <EmptyState title="No flats yet" hint="Upload a CSV above to get started." />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700/40 dark:border-slate-700 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3 pr-4">Block</th>
                    <th className="py-3 pr-4">Flat</th>
                    <th className="py-3 pr-4">Owner</th>
                    <th className="py-3 pr-4">Email</th>
                    <th className="py-3 pr-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {flats.map((f) => {
                    const owner = f.owner_user_id ? ownerById.get(f.owner_user_id) : undefined;
                    return (
                      <tr key={f.id} className="border-b border-slate-100 dark:border-slate-700/50 transition-colors hover:bg-white/5">
                        <td className="py-4 pr-4 font-semibold text-slate-900 dark:text-slate-100">{f.block}</td>
                        <td className="py-4 pr-4 font-medium text-slate-900 dark:text-slate-200">{f.number}</td>
                        <td className="py-4 pr-4 text-slate-700 dark:text-slate-300">{owner?.name ?? "—"}</td>
                        <td className="py-4 pr-4 text-slate-500 dark:text-slate-400">{owner?.email ?? "—"}</td>
                        <td className="py-4 pr-4">
                          {owner
                            ? <span className="inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400">Assigned</span>
                            : <span className="inline-flex items-center rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-400">Unassigned</span>
                          }
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

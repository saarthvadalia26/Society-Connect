import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { supabaseServer } from "@/lib/supabase";
import { Card, CardBody, CardHeader, Button, Input, Label, Badge, EmptyState } from "@/components/ui";
import { AddMemberForm } from "@/components/add-member-form";
import { PageHeader } from "@/components/nav";

interface PageProps {
  searchParams: { error?: string; success?: string };
}

async function addMemberAction(formData: FormData) {
  "use server";
  const admin = await requireRole("admin");
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "resident") as "resident" | "guard";
  const block = String(formData.get("block") ?? "").trim().toUpperCase();
  const flatNumber = String(formData.get("flat_number") ?? "").trim();

  if (!name || !email || !password) {
    redirect("/admin/members?error=" + encodeURIComponent("Name, email, and password are required."));
  }
  if (password.length < 6) {
    redirect("/admin/members?error=" + encodeURIComponent("Password must be at least 6 characters."));
  }

  const supabase = supabaseServer();

  // Check if email already exists
  const { data: existingUser } = await supabase
    .from("app_users")
    .select("id")
    .ilike("email", email)
    .maybeSingle();
  if (existingUser) {
    redirect("/admin/members?error=" + encodeURIComponent("A member with this email already exists."));
  }

  // 1. Create the app_users row
  let flatId: string | null = null;
  if (block && flatNumber) {
    // Find or create the flat
    const { data: existingFlat } = await supabase
      .from("flats")
      .select("id")
      .eq("society_id", admin.society_id)
      .eq("block", block)
      .eq("number", flatNumber)
      .maybeSingle();
    if (existingFlat) {
      flatId = existingFlat.id;
    } else {
      const { data: newFlat } = await supabase
        .from("flats")
        .insert({ society_id: admin.society_id, block, number: flatNumber })
        .select("id")
        .single();
      flatId = newFlat?.id ?? null;
    }
  }

  const { error: profileError } = await supabase.from("app_users").insert({
    email,
    name,
    role,
    society_id: admin.society_id,
    flat_id: flatId,
  });

  if (profileError) {
    redirect("/admin/members?error=" + encodeURIComponent(profileError.message));
  }

  // Link flat to owner if resident
  if (flatId) {
    const { data: newUser } = await supabase
      .from("app_users")
      .select("id")
      .ilike("email", email)
      .maybeSingle();
    if (newUser) {
      await supabase.from("flats").update({ owner_user_id: newUser.id }).eq("id", flatId);
    }
  }

  // Now create the actual auth account so they can sign in.
  // We do a server-side signUp with the member's credentials.
  // Important: this doesn't affect the admin's session because signUp
  // doesn't sign in the new user when called server-side.
  const signUpClient = supabaseServer();
  await signUpClient.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });

  revalidatePath("/admin/members");
  redirect("/admin/members?success=" + encodeURIComponent(`${name} added as ${role}.`));
}

async function transferSecretaryAction(formData: FormData) {
  "use server";
  const admin = await requireRole("admin");
  const newSecretaryId = String(formData.get("new_secretary_id") ?? "");
  if (!newSecretaryId || newSecretaryId === admin.id) return;
  const supabase = supabaseServer();
  // Promote the chosen resident to admin (secretary)
  await supabase
    .from("app_users")
    .update({ role: "admin" })
    .eq("id", newSecretaryId)
    .eq("society_id", admin.society_id);
  // Demote current secretary to resident
  await supabase
    .from("app_users")
    .update({ role: "resident" })
    .eq("id", admin.id);
  revalidatePath("/admin/members");
  // Current user is no longer admin — redirect to resident portal
  redirect("/resident");
}

async function removeMemberAction(formData: FormData) {
  "use server";
  const admin = await requireRole("admin");
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = supabaseServer();
  // Don't allow removing yourself
  if (id === admin.id) return;
  await supabase.from("app_users").delete().eq("id", id).eq("society_id", admin.society_id);
  revalidatePath("/admin/members");
}

export default async function MembersPage({ searchParams }: PageProps) {
  const user = await requireRole("admin");
  const allUsers = await db.listUsers(user.society_id);
  const flats = await db.listFlats(user.society_id);
  const flatById = new Map(flats.map((f) => [f.id, f] as const));

  const admins = allUsers.filter((u) => u.role === "admin");
  const residents = allUsers.filter((u) => u.role === "resident");
  const guards = allUsers.filter((u) => u.role === "guard");

  return (
    <div>
      <PageHeader
        title="Members"
        description="Add residents and guards. They'll sign in with their email + password. Transfer the secretary role when the committee changes."
      />

      {searchParams.success ? (
        <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {searchParams.success}
        </div>
      ) : null}
      {searchParams.error ? (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {searchParams.error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader title="Add a member" />
          <CardBody>
            <AddMemberForm action={addMemberAction} />
          </CardBody>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Secretary" />
            <CardBody>
              <ul className="divide-y divide-slate-100">
                {admins.map((u) => (
                  <li key={u.id} className="flex items-center justify-between py-2 first:pt-0 last:pb-0">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="!text-sm !font-bold !text-white !opacity-100" style={{ color: '#ffffff' }}>{u.name}</span>
                        <Badge tone="blue">secretary</Badge>
                      </div>
                      <div className="!text-xs !text-[#94a3b8]" style={{ color: '#94a3b8' }}>{u.email}</div>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide !text-white" style={{ color: '#ffffff' }}>Transfer secretary role</div>
                <p className="mb-2 text-xs !text-slate-300">Hand over control to another resident. You'll become a resident and they'll become the new secretary.</p>
                {residents.length > 0 ? (
                  <form action={transferSecretaryAction} className="flex flex-wrap items-end gap-2">
                    <select
                      name="new_secretary_id"
                      required
                      className="flex-1 rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-white shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    >
                      <option value="" className="bg-slate-900">Select a resident...</option>
                      {residents.map((r) => (
                        <option key={r.id} value={r.id} className="bg-slate-900">{r.name} ({r.email})</option>
                      ))}
                    </select>
                    <Button variant="danger" type="submit">Transfer</Button>
                  </form>
                ) : (
                  <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-xs text-slate-500">
                    Add at least one resident first — then you can transfer the secretary role to them.
                  </div>
                )}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title={`Residents (${residents.length})`} />
            <CardBody>
              {residents.length === 0 ? (
                <EmptyState title="No residents yet" hint="Add one using the form." />
              ) : (
                <ul className="divide-y divide-slate-100">
                  {residents.map((u) => {
                    const flat = u.flat_id ? flatById.get(u.flat_id) : undefined;
                    return (
                      <li key={u.id} className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0">
                        <div>
                        <div className="flex items-center gap-2">
                          <span className="!text-sm !font-bold !text-white !opacity-100" style={{ color: '#ffffff' }}>{u.name}</span>
                          <Badge tone="slate">resident</Badge>
                        </div>
                        <div className="!text-xs !text-[#94a3b8]" style={{ color: '#94a3b8' }}>
                          {u.email}
                          {flat ? ` · Block ${flat.block}, Flat ${flat.number}` : ""}
                        </div>
                        </div>
                        <form action={removeMemberAction}>
                          <input type="hidden" name="id" value={u.id} />
                          <Button variant="ghost" type="submit">Remove</Button>
                        </form>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title={`Guards (${guards.length})`} />
            <CardBody>
              {guards.length === 0 ? (
                <EmptyState title="No guards yet" hint="Add one with the 'Security Guard' role." />
              ) : (
                <ul className="divide-y divide-slate-100">
                  {guards.map((u) => (
                    <li key={u.id} className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="!text-sm !font-bold !text-white !opacity-100" style={{ color: '#ffffff' }}>{u.name}</span>
                          <Badge tone="amber">guard</Badge>
                        </div>
                        <div className="!text-xs !text-[#94a3b8]" style={{ color: '#94a3b8' }}>{u.email}</div>
                      </div>
                      <form action={removeMemberAction}>
                        <input type="hidden" name="id" value={u.id} />
                        <Button variant="ghost" type="submit">Remove</Button>
                      </form>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

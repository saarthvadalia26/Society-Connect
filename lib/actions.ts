"use server";

import { signOut, requireRole } from "@/lib/auth";
import { redirect } from "next/navigation";
import { supabaseServer, supabaseAdmin } from "@/lib/supabase";

export async function signOutAction() {
  await signOut();
  redirect("/login");
}

export async function deleteSocietyAction() {
  const admin = await requireRole("admin");
  const supabase = supabaseServer();
  const sid = admin.society_id;

  // 1. Collect all member emails so we can delete their auth accounts later
  const { data: members } = await supabase
    .from("app_users")
    .select("email")
    .eq("society_id", sid);
  const memberEmails = (members ?? []).map((m: { email: string }) => m.email);

  // 2. Delete all society data (children first for FK constraints)
  const { data: flats } = await supabase.from("flats").select("id").eq("society_id", sid);
  const flatIds = (flats ?? []).map((f: { id: string }) => f.id);
  if (flatIds.length > 0) {
    await supabase.from("visitors").delete().in("flat_id", flatIds);
    await supabase.from("bookings").delete().in("flat_id", flatIds);
    await supabase.from("complaints").delete().in("flat_id", flatIds);
    await supabase.from("bills").delete().in("flat_id", flatIds);
  }
  await supabase.from("facilities").delete().eq("society_id", sid);
  await supabase.from("contacts").delete().eq("society_id", sid);
  await supabase.from("notices").delete().eq("society_id", sid);
  await supabase.from("expenses").delete().eq("society_id", sid);
  if (flatIds.length > 0) {
    await supabase.from("app_users").update({ flat_id: null }).eq("society_id", sid);
    await supabase.from("flats").delete().eq("society_id", sid);
  }
  await supabase.from("app_users").delete().eq("society_id", sid);
  await supabase.from("societies").delete().eq("id", sid);

  // 3. Delete Supabase Auth accounts for all members using the service-role client
  const admin_client = supabaseAdmin();
  if (admin_client) {
    const { data: authList } = await admin_client.auth.admin.listUsers();
    const authUsers = authList?.users ?? [];
    for (const email of memberEmails) {
      const authUser = authUsers.find(
        (u) => u.email?.toLowerCase() === email.toLowerCase(),
      );
      if (authUser) {
        await admin_client.auth.admin.deleteUser(authUser.id);
      }
    }
  }

  // 4. Sign out current user and redirect
  await signOut();
  redirect("/login?success=" + encodeURIComponent("Society deleted successfully. All accounts have been removed."));
}

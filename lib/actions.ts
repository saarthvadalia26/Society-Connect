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
  const sid = admin.society_id;
  const adminClient = supabaseAdmin();
  const sb = adminClient ?? supabaseServer();

  // 1. Collect all users belonging to this society (both user ID and email)
  const { data: members } = await sb
    .from("app_users")
    .select("id, email")
    .eq("society_id", sid);
  const userList = (members ?? []) as Array<{ id: string; email: string }>;
  const userIds = userList.map((m) => m.id);
  const memberEmails = userList.map((m) => m.email).filter(Boolean);

  // 2. Collect all flat IDs belonging to this society
  const { data: flats } = await sb
    .from("flats")
    .select("id")
    .eq("society_id", sid);
  const flatIds = ((flats ?? []) as Array<{ id: string }>).map((f) => f.id);

  // 3. Collect all facility IDs belonging to this society
  const { data: facilities } = await sb
    .from("facilities")
    .select("id")
    .eq("society_id", sid);
  const facilityIds = ((facilities ?? []) as Array<{ id: string }>).map((f) => f.id);

  // 4. Break circular & self-referential foreign key constraints first
  await sb.from("app_users").update({ flat_id: null }).eq("society_id", sid);
  await sb.from("flats").update({ owner_user_id: null }).eq("society_id", sid);
  await sb.from("notices").update({ created_by: null }).eq("society_id", sid);

  // 5. Delete child data in proper dependency order (leaf records first)
  // Visitors
  if (flatIds.length > 0) {
    await sb.from("visitors").delete().in("flat_id", flatIds);
  }

  // Bookings (reference both flat_id and facility_id)
  if (flatIds.length > 0) {
    await sb.from("bookings").delete().in("flat_id", flatIds);
  }
  if (facilityIds.length > 0) {
    await sb.from("bookings").delete().in("facility_id", facilityIds);
  }

  // Complaints
  if (flatIds.length > 0) {
    await sb.from("complaints").delete().in("flat_id", flatIds);
  }

  // Bills
  if (flatIds.length > 0) {
    await sb.from("bills").delete().in("flat_id", flatIds);
  }

  // Expenses, Notices, Contacts, Facilities
  await sb.from("expenses").delete().eq("society_id", sid);
  await sb.from("notices").delete().eq("society_id", sid);
  await sb.from("contacts").delete().eq("society_id", sid);
  await sb.from("facilities").delete().eq("society_id", sid);

  // Flats
  await sb.from("flats").delete().eq("society_id", sid);

  // App Users (database profile rows)
  await sb.from("app_users").delete().eq("society_id", sid);

  // Society row itself
  await sb.from("societies").delete().eq("id", sid);

  // 6. Delete Supabase Auth accounts for all society members (including admin)
  if (adminClient?.auth?.admin) {
    // Delete directly by user UUID (exact auth user id)
    for (const uid of userIds) {
      try {
        await adminClient.auth.admin.deleteUser(uid);
      } catch (err) {
        console.warn(`[deleteSocietyAction] Error deleting auth user ${uid}:`, err);
      }
    }

    // Also check by email in case any auth account had a different UID
    if (memberEmails.length > 0) {
      try {
        const { data: authList } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
        const authUsers = authList?.users ?? [];
        for (const email of memberEmails) {
          const authUser = authUsers.find(
            (u) => u.email?.toLowerCase() === email.toLowerCase(),
          );
          if (authUser) {
            try {
              await adminClient.auth.admin.deleteUser(authUser.id);
            } catch (err) {
              console.warn(`[deleteSocietyAction] Error deleting auth user by email ${email}:`, err);
            }
          }
        }
      } catch (err) {
        console.warn("[deleteSocietyAction] Error listing auth users:", err);
      }
    }
  }

  // 7. Sign out current user and redirect
  try {
    await signOut();
  } catch {}

  redirect("/login?success=" + encodeURIComponent("Society and all associated data, users, and accounts have been permanently deleted."));
}

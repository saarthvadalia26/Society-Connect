"use server";

import { signOut, requireRole } from "@/lib/auth";
import { redirect } from "next/navigation";
import { supabaseServer, supabaseAdmin } from "@/lib/supabase";
import { createClient } from "@supabase/supabase-js";

export async function signOutAction() {
  await signOut();
  redirect("/login");
}

/**
 * Permanently deletes a society and all associated data, users, and auth accounts.
 * Requires:
 * 1. Admin role authorization
 * 2. Strict password authentication (verifying admin credentials)
 * 3. Exact society name confirmation
 */
export async function deleteSocietyAction(
  formData: FormData
): Promise<{ error?: string } | undefined> {
  const admin = await requireRole("admin");
  const sid = admin.society_id;

  const password = String(formData.get("password") ?? "").trim();
  const confirmName = String(formData.get("confirmName") ?? "").trim();

  if (!password) {
    return { error: "Admin password is required to authorize society deletion." };
  }

  const adminClient = supabaseAdmin();
  const sb = adminClient ?? supabaseServer();

  // 1. Fetch society record to verify name confirmation
  const { data: society, error: socError } = await sb
    .from("societies")
    .select("name")
    .eq("id", sid)
    .single();

  if (socError || !society) {
    return { error: "Society not found or already deleted." };
  }

  if (confirmName.toLowerCase() !== society.name.trim().toLowerCase()) {
    return {
      error: `Society name does not match. Please type "${society.name}" exactly to confirm.`,
    };
  }

  // 2. Strict Authentication: Verify the admin's password against Supabase Auth
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
  const authVerifier = createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  const { error: authError } = await authVerifier.auth.signInWithPassword({
    email: admin.email,
    password,
  });

  if (authError) {
    return {
      error:
        "Authentication failed: Incorrect admin password. Society deletion was not authorized.",
    };
  }

  // 3. Collect all user IDs & emails belonging to this society BEFORE database deletion
  const { data: members } = await sb
    .from("app_users")
    .select("id, email")
    .eq("society_id", sid);
  const userList = (members ?? []) as Array<{ id: string; email: string }>;
  const userIds = userList.map((m) => m.id);
  const memberEmails = userList.map((m) => m.email).filter(Boolean);

  // 4. Try atomic PostgreSQL RPC cascade function first
  let rpcSuccess = false;
  try {
    const { error: rpcErr } = await sb.rpc("delete_society_completely", {
      target_society_id: sid,
    });
    if (!rpcErr) {
      rpcSuccess = true;
    } else {
      console.warn(
        "[deleteSocietyAction] RPC failed or not present, running manual cascade:",
        rpcErr.message
      );
    }
  } catch (err) {
    console.warn(
      "[deleteSocietyAction] RPC exception, running manual cascade:",
      err
    );
  }

  // 5. If RPC not available, run manual cascading deletion
  if (!rpcSuccess) {
    // Collect flat IDs
    const { data: flats } = await sb
      .from("flats")
      .select("id")
      .eq("society_id", sid);
    const flatIds = ((flats ?? []) as Array<{ id: string }>).map((f) => f.id);

    // Collect facility IDs
    const { data: facilities } = await sb
      .from("facilities")
      .select("id")
      .eq("society_id", sid);
    const facilityIds = ((facilities ?? []) as Array<{ id: string }>).map(
      (f) => f.id
    );

    // Break circular & foreign keys first
    await sb.from("app_users").update({ flat_id: null }).eq("society_id", sid);
    await sb.from("flats").update({ owner_user_id: null }).eq("society_id", sid);
    await sb.from("notices").update({ created_by: null }).eq("society_id", sid);

    // Delete child records for flats
    if (flatIds.length > 0) {
      await sb.from("visitors").delete().in("flat_id", flatIds);
      await sb.from("complaints").delete().in("flat_id", flatIds);
      await sb.from("bills").delete().in("flat_id", flatIds);
      await sb.from("bookings").delete().in("flat_id", flatIds);
    }

    // Delete facility bookings
    if (facilityIds.length > 0) {
      await sb.from("bookings").delete().in("facility_id", facilityIds);
    }

    // Delete society-level child tables
    await sb.from("expenses").delete().eq("society_id", sid);
    await sb.from("notices").delete().eq("society_id", sid);
    await sb.from("contacts").delete().eq("society_id", sid);
    await sb.from("facilities").delete().eq("society_id", sid);

    // Delete flats
    await sb.from("flats").delete().eq("society_id", sid);

    // Delete app_users profile rows
    await sb.from("app_users").delete().eq("society_id", sid);

    // Delete the society row itself
    const { error: socDeleteErr } = await sb
      .from("societies")
      .delete()
      .eq("id", sid);
    if (socDeleteErr) {
      console.error(
        "[deleteSocietyAction] Error deleting society row:",
        socDeleteErr
      );
      return {
        error: `Database error while deleting society: ${socDeleteErr.message}`,
      };
    }
  }

  // 6. Permanently delete all Supabase Auth user accounts (auth.users)
  // Ensures all members (admin, residents, guards) can never sign in again
  if (adminClient?.auth?.admin) {
    for (const uid of userIds) {
      try {
        await adminClient.auth.admin.deleteUser(uid);
      } catch (err) {
        console.warn(`[deleteSocietyAction] Error deleting auth user ${uid}:`, err);
      }
    }

    if (memberEmails.length > 0) {
      try {
        const { data: authList } = await adminClient.auth.admin.listUsers({
          perPage: 1000,
        });
        const authUsers = authList?.users ?? [];
        for (const email of memberEmails) {
          const authUser = authUsers.find(
            (u) => u.email?.toLowerCase() === email.toLowerCase()
          );
          if (authUser) {
            try {
              await adminClient.auth.admin.deleteUser(authUser.id);
            } catch (err) {
              console.warn(
                `[deleteSocietyAction] Error deleting auth user by email ${email}:`,
                err
              );
            }
          }
        }
      } catch (err) {
        console.warn("[deleteSocietyAction] Error listing auth users:", err);
      }
    }
  }

  // 7. Sign out current session and redirect to login
  try {
    await signOut();
  } catch {}

  redirect(
    "/login?success=" +
      encodeURIComponent(
        "Society and all associated members, accounts, and data have been permanently deleted."
      )
  );
}

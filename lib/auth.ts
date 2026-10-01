// Supabase-backed auth. Sign in with email + password.
// getCurrentUser() returns the matching app_users row (linked by email).
// Wrapped with React cache() to deduplicate auth & DB lookups across layout + page.
import { cache } from "react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { supabaseServer, supabaseAdmin } from "./supabase";
import type { Role, User } from "./types";

export const getCurrentUser = cache(async (): Promise<User | null> => {
  let userEmail: string | null = null;

  // 1. Fast path: check if middleware already authenticated and verified the user email
  try {
    const headerList = headers();
    userEmail = headerList.get("x-user-email");
  } catch {
    // headers() might not be available in non-request contexts
  }

  // 2. Fallback path: verify token directly with Supabase Auth API
  if (!userEmail) {
    const supabase = supabaseServer();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (!authUser?.email) return null;
    userEmail = authUser.email;
  }

  // 3. Query app_users and linked society record
  const db = supabaseAdmin() ?? supabaseServer();
  const { data, error } = await db
    .from("app_users")
    .select("id, email, name, role, society_id, flat_id, societies(name, currency)")
    .ilike("email", userEmail)
    .maybeSingle();

  if (error || !data) return null;

  const user = {
    ...data,
    currency: (data as any).societies?.currency || "INR",
    society_name: (data as any).societies?.name || "Society",
  };
  return user as User;
});

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireRole(role: Role): Promise<User> {
  const user = await requireUser();
  if (user.role !== role) {
    if (user.role === "admin") redirect("/admin");
    if (user.role === "guard") redirect("/guard");
    redirect("/resident");
  }
  return user;
}

export async function signInWithPassword(email: string, password: string) {
  const supabase = supabaseServer();
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signOut() {
  const supabase = supabaseServer();
  await supabase.auth.signOut();
}

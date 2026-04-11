// Supabase-backed auth. Sign in with email + password.
// getCurrentUser() returns the matching app_users row (linked by email).
import { redirect } from "next/navigation";
import { supabaseServer } from "./supabase";
import type { Role, User } from "./types";

export async function getCurrentUser(): Promise<User | null> {
  const supabase = supabaseServer();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser?.email) return null;

  const { data, error } = await supabase
    .from("app_users")
    .select("id, email, name, role, society_id, flat_id, societies(currency)")
    .ilike("email", authUser.email)
    .maybeSingle();
  if (error || !data) return null;
  const user = {
    ...data,
    currency: (data as any).societies?.currency || "INR",
  };
  return user as User;
}

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

"use server";

import { redirect } from "next/navigation";
import { supabaseServer, supabaseAdmin } from "@/lib/supabase";

export async function registerAction(prevState: any, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const society = String(formData.get("society") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const currency = String(formData.get("currency") ?? "INR");

  if (!name || !email || !password || !society) {
    return { error: "All fields except address are required." };
  }
  if (password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }

  const supabase = supabaseServer();

  // Check if society already exists (case-insensitive)
  const { data: existingSociety } = await supabase
    .from("societies")
    .select("id")
    .ilike("name", society)
    .maybeSingle();

  if (existingSociety) {
    return { error: "Society Name already exists. Please contact the existing admin or choose another name." };
  }

  // Create Auth user
  const { data: authData, error: signUpError } = await supabase.auth.signUp({ 
    email, 
    password, 
    options: { data: { name } } 
  });
  
  if (signUpError) {
    return { error: `Auth Error: ${signUpError.message}` };
  }
  
  const userId = authData?.user?.id;

  // Sign them in
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (signInError) {
    return { error: `Sign In Error: ${signInError.message}` };
  }

  // In case profile somehow exists (edge case)
  const { data: existingUser } = await supabase
    .from("app_users")
    .select("id")
    .ilike("email", email)
    .maybeSingle();
    
  if (existingUser) {
    redirect("/admin/onboarding");
  }

  // Insert Society
  const { data: societyRow, error: socError } = await supabase
    .from("societies")
    .insert({ name: society, address: address || "", currency })
    .select("id")
    .single();
    
  if (socError || !societyRow) {
    if (userId) await supabaseAdmin()?.auth.admin.deleteUser(userId);
    // If unique constraint triggers here instead of our earlier check
    if (socError?.code === '23505') {
        return { error: "Database Error: Society Name already exists." };
    }
    return { error: `Database Error (societies): ${socError?.message ?? "Unknown error"}` };
  }

  // Insert Profile
  const { error: userError } = await supabase.from("app_users").insert({
    email,
    name,
    role: "admin",
    society_id: societyRow.id,
  });
  
  if (userError) {
    if (userId) await supabaseAdmin()?.auth.admin.deleteUser(userId);
    return { error: `Database Error (app_users): ${userError.message}` };
  }

  redirect("/admin/onboarding");
}

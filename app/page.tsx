import { redirect } from "next/navigation";
import { getCurrentUser, signOut } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase";

export default async function HomePage() {
  const user = await getCurrentUser();

  if (!user) {
    // Check if there's an active Supabase auth session but no matching app_users row.
    // If so, sign them out to break the redirect loop and show a clear error.
    const supabase = supabaseServer();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) {
      await signOut();
      redirect("/login?error=" + encodeURIComponent(
        `Signed in as ${authUser.email} but no app_users row found. Run the migration + seed SQL in Supabase first.`
      ));
    }
    redirect("/login");
  }

  if (user.role === "admin") redirect("/admin");
  if (user.role === "guard") redirect("/guard");
  redirect("/resident");
}

import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase";
import { Card, CardBody, Label, Input } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { PasswordInput } from "@/components/password-input";
import { getCurrentUser } from "@/lib/auth";

interface PageProps {
  searchParams: { error?: string; success?: string };
}

async function registerAction(formData: FormData) {
  "use server";
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const society = String(formData.get("society") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();

  if (!name || !email || !password || !society) {
    redirect("/register?error=" + encodeURIComponent("All fields except address are required."));
  }
  if (password.length < 6) {
    redirect("/register?error=" + encodeURIComponent("Password must be at least 6 characters."));
  }

  const supabase = supabaseServer();

  await supabase.auth.signUp({ email, password, options: { data: { name } } });

  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (signInError) {
    redirect("/register?error=" + encodeURIComponent(signInError.message));
  }

  const { data: existing } = await supabase
    .from("app_users")
    .select("id")
    .ilike("email", email)
    .maybeSingle();
  if (existing) {
    redirect("/admin/onboarding");
  }

  const { data: societyRow, error: socError } = await supabase
    .from("societies")
    .insert({ name: society, address: address || "" })
    .select("id")
    .single();
  if (socError || !societyRow) {
    redirect("/register?error=" + encodeURIComponent("Failed to create society: " + (socError?.message ?? "")));
  }

  const { error: userError } = await supabase.from("app_users").insert({
    email,
    name,
    role: "admin",
    society_id: societyRow.id,
  });
  if (userError) {
    redirect("/register?error=" + encodeURIComponent("Failed to create profile: " + userError.message));
  }

  redirect("/admin/onboarding");
}

export default function RegisterPage({ searchParams }: PageProps) {
  const errorMsg = searchParams.error;

  return (
    <main className="flex min-h-screen">
      {/* Left: gradient hero */}
      <div className="hidden w-1/2 flex-col justify-between bg-gradient-to-br from-emerald-700 via-teal-800 to-cyan-900 p-12 text-white lg:flex">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 text-lg font-bold backdrop-blur-sm">SC</div>
            <span className="text-lg font-bold">Society Connect</span>
          </div>
        </div>
        <div>
          <h2 className="text-4xl font-bold leading-tight">Register your<br />society today.</h2>
          <p className="mt-4 max-w-md text-base leading-relaxed text-emerald-100">
            Set up in under 2 minutes. Add your flats, invite residents, and start collecting maintenance digitally. No more paper registers.
          </p>
          <div className="mt-8 flex gap-6 text-sm text-emerald-200/80">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-[10px]">✓</span>
              Free to start
            </div>
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-[10px]">✓</span>
              No credit card
            </div>
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-[10px]">✓</span>
              UPI ready
            </div>
          </div>
        </div>
        <div className="text-sm text-emerald-200/60">
          Join hundreds of societies simplifying their management
        </div>
      </div>

      {/* Right: form */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center lg:text-left">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-xl font-bold text-white shadow-lg lg:hidden">
              SC
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Create your society</h1>
            <p className="mt-1 text-sm text-slate-500">
              You'll become the first secretary. You can transfer this role later.
            </p>
          </div>

          <Card>
            <CardBody>
              <form action={registerAction} className="space-y-4">
                <div>
                  <Label htmlFor="name">Your name</Label>
                  <Input id="name" name="name" required placeholder="e.g. Priya Mehta" />
                </div>
                <div>
                  <Label htmlFor="email">Email address</Label>
                  <Input id="email" name="email" type="email" autoComplete="email" required placeholder="you@example.com" />
                </div>
                <div>
                  <Label htmlFor="password">Password (min 6 characters)</Label>
                  <PasswordInput id="password" name="password" autoComplete="new-password" required minLength={6} />
                </div>
                <div className="border-t border-slate-100 pt-4">
                  <Label htmlFor="society">Society name</Label>
                  <Input id="society" name="society" required placeholder="e.g. Greenwood Heights" />
                </div>
                <div>
                  <Label htmlFor="address">Society address (optional)</Label>
                  <Input id="address" name="address" placeholder="e.g. Sector 21, Pune, MH 411014" />
                </div>
                {errorMsg ? (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-800">
                    {errorMsg}
                  </div>
                ) : null}
                <SubmitButton loadingText="Registering your society...">
                  Register
                </SubmitButton>
              </form>
            </CardBody>
          </Card>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already registered?{" "}
            <a href="/login" className="font-semibold text-brand-600 hover:text-brand-700 hover:underline">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}

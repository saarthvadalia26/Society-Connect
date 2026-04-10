import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth";
import { Card, CardBody, CardHeader, Label, Input } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

interface PageProps {
  searchParams: { error?: string; success?: string };
}

async function signInAction(formData: FormData) {
  "use server";
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) {
    redirect("/login?error=Email+and+password+required");
  }
  const supabase = supabaseServer();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?error=No+account+found+for+this+email.+Ask+your+secretary+to+add+you.");
  }
  if (user.role === "admin") redirect("/admin");
  if (user.role === "guard") redirect("/guard");
  redirect("/resident");
}

export default function LoginPage({ searchParams }: PageProps) {
  const errorMsg = searchParams.error;
  const successMsg = searchParams.success;
  return (
    <main className="flex min-h-screen">
      {/* Left: gradient hero */}
      <div className="hidden w-1/2 flex-col justify-between bg-gradient-to-br from-brand-700 via-blue-800 to-indigo-900 p-12 text-white lg:flex">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 text-lg font-bold backdrop-blur-sm">SC</div>
            <span className="text-lg font-bold">Society Connect</span>
          </div>
        </div>
        <div>
          <h2 className="text-4xl font-bold leading-tight">Your Society,<br />Simplified.</h2>
          <p className="mt-4 max-w-md text-base leading-relaxed text-blue-100">
            Replace noisy WhatsApp groups, paper registers, and manual receipts with one professional dashboard. Finance, communication, and security — all in one place.
          </p>
        </div>
        <div className="text-sm text-blue-200/60">
          Trusted by housing societies across India
        </div>
      </div>

      {/* Right: form */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center lg:text-left">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-blue-700 text-xl font-bold text-white shadow-lg lg:hidden">
              SC
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
            <p className="mt-1 text-sm text-slate-500">
              Sign in with the credentials your society secretary gave you.
            </p>
          </div>

          <Card>
            <CardBody>
              <form action={signInAction} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email address</Label>
                  <Input id="email" name="email" type="email" autoComplete="email" required placeholder="you@example.com" />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" name="password" type="password" autoComplete="current-password" required />
                </div>
                {successMsg ? (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800">
                    {successMsg}
                  </div>
                ) : null}
                {errorMsg ? (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-800">
                    {errorMsg}
                  </div>
                ) : null}
                <SubmitButton loadingText="Signing in...">
                  Sign in
                </SubmitButton>
              </form>
            </CardBody>
          </Card>

          <p className="mt-6 text-center text-sm text-slate-500">
            Setting up a new society?{" "}
            <a href="/register" className="font-semibold text-brand-600 hover:text-brand-700 hover:underline">
              Register your society
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}

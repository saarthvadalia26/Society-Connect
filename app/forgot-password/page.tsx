import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase";
import { Card, CardBody, Label, Input } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

interface PageProps {
  searchParams: { error?: string; success?: string };
}

async function resetAction(formData: FormData) {
  "use server";
  const email = String(formData.get("email") ?? "").trim();
  if (!email) {
    redirect("/forgot-password?error=" + encodeURIComponent("Email is required."));
  }
  const supabase = supabaseServer();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SUPABASE_URL ? "" : "http://localhost:3001"}/reset-password`,
  });
  if (error) {
    redirect("/forgot-password?error=" + encodeURIComponent(error.message));
  }
  redirect("/forgot-password?success=" + encodeURIComponent("Password reset link sent! Check your email inbox."));
}

export default function ForgotPasswordPage({ searchParams }: PageProps) {
  const errorMsg = searchParams.error;
  const successMsg = searchParams.success;

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-blue-700 text-xl font-bold text-white shadow-lg">
            SC
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Reset your password</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Enter your email and we'll send you a link to reset your password.
          </p>
        </div>

        <Card>
          <CardBody>
            <form action={resetAction} className="space-y-4">
              <div>
                <Label htmlFor="email">Email address</Label>
                <Input id="email" name="email" type="email" autoComplete="email" required placeholder="you@example.com" />
              </div>
              {successMsg ? (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400">
                  {successMsg}
                </div>
              ) : null}
              {errorMsg ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                  {errorMsg}
                </div>
              ) : null}
              <SubmitButton loadingText="Sending reset link...">
                Send reset link
              </SubmitButton>
            </form>
          </CardBody>
        </Card>

        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          Remember your password?{" "}
          <a href="/login" className="font-semibold text-brand-600 hover:text-brand-700 hover:underline">
            Sign in
          </a>
        </p>
      </div>
    </main>
  );
}

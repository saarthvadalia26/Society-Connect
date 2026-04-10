import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth";
import { Label, Input } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { PasswordInput } from "@/components/password-input";
import { ShieldCheck, BarChart3, Users } from "lucide-react";

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

const features = [
  {
    icon: BarChart3,
    title: "Smart Finance",
    desc: "Digital maintenance collection, automated ledgers, and real-time reports.",
  },
  {
    icon: Users,
    title: "Resident Communication",
    desc: "Replace chaotic WhatsApp groups with structured notices and complaints.",
  },
  {
    icon: ShieldCheck,
    title: "Gated Security",
    desc: "Visitor pre-approval, guard logs, and facial access — all in one place.",
  },
];

export default function LoginPage({ searchParams }: PageProps) {
  const errorMsg = searchParams.error;
  const successMsg = searchParams.success;

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      {/* ── LEFT PANEL: Deep Navy Marketing ─────────────────── */}
      <div className="relative hidden overflow-hidden bg-slate-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        {/* Ambient glow blobs */}
        <div className="pointer-events-none absolute -top-40 -left-40 h-[480px] w-[480px] rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-[360px] w-[360px] rounded-full bg-indigo-500/10 blur-[100px]" />

        {/* Subtle dot-grid overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "radial-gradient(circle, #ffffff 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-lg font-bold backdrop-blur-md shadow-[0_0_20px_rgba(255,255,255,0.04)]">
            SC
          </div>
          <span className="text-lg font-semibold tracking-wide text-slate-200">
            Society Connect
          </span>
        </div>

        {/* Hero copy + feature list */}
        <div className="relative z-10">
          <h2 className="text-[2.6rem] font-bold leading-[1.12] tracking-tight">
            Your Society,
            <br />
            <span className="text-slate-400">Simplified.</span>
          </h2>
          <p className="mt-5 max-w-sm text-base font-light leading-relaxed text-slate-300">
            One professional dashboard replaces noisy group chats, paper
            registers, and manual receipts.
          </p>

          <ul className="mt-10 space-y-6">
            {features.map(({ icon: Icon, title, desc }) => (
              <li key={title} className="flex items-start gap-4">
                <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-emerald-500/25 bg-emerald-500/15 text-emerald-400">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-semibold text-slate-100">{title}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-slate-400">
                    {desc}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Social proof */}
        <p className="relative z-10 flex items-center gap-2 text-sm font-medium text-slate-500">
          <svg
            className="h-4 w-4 text-slate-600"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
              clipRule="evenodd"
            />
          </svg>
          Trusted by housing societies across India
        </p>
      </div>

      {/* ── RIGHT PANEL: Login Form ──────────────────────────── */}
      <div className="flex flex-col items-center justify-center bg-slate-50 px-6 py-14 sm:px-12">
        {/* Mobile logo — only visible below lg */}
        <div className="mb-8 flex flex-col items-center lg:hidden">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-indigo-700 text-xl font-bold text-white shadow-lg">
            SC
          </div>
          <span className="mt-3 text-base font-semibold text-slate-700">
            Society Connect
          </span>
        </div>

        {/* Form card */}
        <div className="w-full max-w-md animate-fade-in">
          <div className="mb-8 lg:text-left text-center">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Welcome back
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Sign in with the credentials your society secretary gave you.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/60">
            <form action={signInAction} className="space-y-5">
              {/* Email */}
              <div>
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="you@example.com"
                  className="mt-1 rounded-xl border-slate-200 shadow-inner focus:border-blue-600 focus:ring-blue-600/20"
                />
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <a
                    href="/forgot-password"
                    className="text-xs font-medium text-slate-500 transition-colors hover:text-brand-600"
                  >
                    Forgot password?
                  </a>
                </div>
                <PasswordInput
                  id="password"
                  name="password"
                  autoComplete="current-password"
                  required
                  className="mt-1 rounded-xl border-slate-200 shadow-inner focus:border-blue-600 focus:ring-blue-600/20"
                />
              </div>

              {/* Success / Error banners */}
              {successMsg ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                  {successMsg}
                </div>
              ) : null}
              {errorMsg ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {errorMsg}
                </div>
              ) : null}

              {/* Shimmer CTA */}
              <SubmitButton loadingText="Signing in..." className="mt-2 py-3 text-base rounded-xl bg-blue-600 hover:bg-blue-700">
                Sign in
              </SubmitButton>
            </form>
          </div>

          <p className="mt-8 text-center text-sm text-slate-500">
            Setting up a new society?{" "}
            <a
              href="/register"
              className="font-semibold text-slate-900 transition-colors hover:text-brand-600"
            >
              Register your society
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}

"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import { registerAction } from "./actions";
import { toast } from "sonner";
import { Card, CardBody, Label, Input } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { PasswordInput } from "@/components/password-input";
import { ArrowRight, Building, User } from "lucide-react";

export function RegistrationWizard() {
  const [step, setStep] = useState(1);
  const [state, formAction] = useFormState(registerAction, { error: "" });

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!name || !email || !password || password.length < 6) {
      toast.error("Registration Incomplete", { 
        description: "Please fill in your name, valid email, and a password of at least 6 characters." 
      });
      return;
    }
    setStep(2);
  };

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center lg:text-left">
        <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-indigo-800 text-xl font-bold text-white shadow-lg lg:mx-0 lg:hidden">
          SC
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          Create your society
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {step === 1 ? "Start by setting up your admin account." : "Now, tell us about your society."}
        </p>
      </div>

      {/* Progress Indicator */}
      <div className="mb-6 flex items-center gap-2">
        <div className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${step >= 1 ? 'bg-brand-600' : 'bg-slate-200 dark:bg-slate-800'}`} />
        <div className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${step >= 2 ? 'bg-brand-600' : 'bg-slate-200 dark:bg-slate-800'}`} />
      </div>

      <Card className="border-slate-200 bg-white/95 backdrop-blur shadow-xl dark:border-slate-800 dark:bg-slate-950/70 dark:shadow-2xl dark:shadow-black/40 relative overflow-hidden">
        <CardBody className="p-6 md:p-8">
          {state?.error ? (
            <div className="mb-5 rounded-lg border border-red-500/30 bg-red-50 px-4 py-3 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-300 font-medium">
              {state.error}
            </div>
          ) : null}

          <form action={formAction} className="relative min-h-[320px]">
            {/* Step 1: Personal Info */}
            <div className={`transition-all duration-300 ${step === 1 ? 'opacity-100 block' : 'opacity-0 hidden pointer-events-none'}`}>
              <div className="mb-6 flex items-center gap-2 text-brand-600 dark:text-brand-400">
                <User className="h-5 w-5" />
                <h2 className="font-semibold text-slate-800 dark:text-slate-200 text-sm uppercase tracking-wider">Your Details</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Full name</Label>
                  <Input id="name" name="name" required placeholder="e.g. Priya Mehta" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="email">Email address</Label>
                  <Input id="email" name="email" type="email" autoComplete="email" required placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="password">Password (min 6 chars)</Label>
                  <PasswordInput id="password" name="password" autoComplete="new-password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                
                <button
                  type="button"
                  onClick={handleNext}
                  className="mt-6 flex w-full group items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-brand-700 active:scale-[0.98]"
                >
                  Continue
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </div>

            {/* Step 2: Society Info */}
            <div className={`transition-all duration-300 ${step === 2 ? 'opacity-100 block' : 'opacity-0 hidden pointer-events-none'}`}>
              <div className="mb-6 flex items-center gap-2 text-brand-600 dark:text-brand-400">
                <Building className="h-5 w-5" />
                <h2 className="font-semibold text-slate-800 dark:text-slate-200 text-sm uppercase tracking-wider">Society Details</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="society">Society name</Label>
                  <Input id="society" name="society" required placeholder="e.g. Greenwood Heights" />
                </div>
                <div>
                  <Label htmlFor="address">Full address (optional)</Label>
                  <Input id="address" name="address" placeholder="e.g. Sector 21, Pune, MH 411014" />
                </div>
                <div>
                  <Label htmlFor="currency">Primary Currency</Label>
                  <select
                    id="currency"
                    name="currency"
                    defaultValue="INR"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 shadow-sm transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-brand-400"
                  >
                    <option value="INR">Indian Rupee (₹ - INR)</option>
                    <option value="USD">US Dollar ($ - USD)</option>
                    <option value="GBP">British Pound (£ - GBP)</option>
                    <option value="EUR">Euro (€ - EUR)</option>
                  </select>
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    Back
                  </button>
                  <div className="flex-1">
                    <SubmitButton loadingText="Setting up..." className="py-3">
                      Register Society
                    </SubmitButton>
                  </div>
                </div>
              </div>
            </div>

          </form>
        </CardBody>
      </Card>

      <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
        Already registered?{" "}
        <a href="/login" className="font-semibold text-brand-600 hover:text-brand-700 dark:text-slate-200 dark:hover:text-brand-400 transition-colors">
          Sign in to your account
        </a>
      </p>
    </div>
  );
}

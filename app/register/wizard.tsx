"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import { registerAction } from "./actions";
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
    // Basic frontend validation for Step 1 before sliding
    if (!name || !email || !password || password.length < 6) {
      alert("Please fill all required fields correctly (password min 6 chars) before proceeding.");
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
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Create your society
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          {step === 1 ? "Start by setting up your admin account." : "Now, tell us about your society."}
        </p>
      </div>

      {/* Progress Indicator */}
      <div className="mb-6 flex items-center gap-2">
        <div className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${step >= 1 ? 'bg-brand-600' : 'bg-slate-200'}`} />
        <div className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${step >= 2 ? 'bg-brand-600' : 'bg-slate-200'}`} />
      </div>

      <Card className="border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden">
        <CardBody className="p-6 md:p-8">
          <form action={formAction} className="relative min-h-[300px]">
            
            {/* Step 1: Personal Info */}
            <div className={`absolute top-0 w-full transition-all duration-400 ${step === 1 ? 'animate-slide-in-left opacity-100 z-10' : 'opacity-0 -translate-x-full pointer-events-none z-0'}`}>
              <div className="mb-4 flex items-center gap-2 text-brand-600 mb-6">
                <User className="h-5 w-5" />
                <h2 className="font-semibold text-slate-800 text-sm uppercase tracking-wider">Your Details</h2>
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
                  className="mt-6 flex w-full group items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-slate-800 active:scale-[0.98]"
                >
                  Continue
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </div>

            {/* Step 2: Society Info */}
            <div className={`absolute top-0 w-full transition-all duration-400 ${step === 2 ? 'animate-slide-in-right opacity-100 z-10' : 'opacity-0 translate-x-full pointer-events-none z-0'}`}>
              <div className="mb-4 flex items-center gap-2 text-brand-600 mb-6">
                <Building className="h-5 w-5" />
                <h2 className="font-semibold text-slate-800 text-sm uppercase tracking-wider">Society Details</h2>
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
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 shadow-sm transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="INR">Indian Rupee (₹ - INR)</option>
                    <option value="USD">US Dollar ($ - USD)</option>
                    <option value="GBP">British Pound (£ - GBP)</option>
                    <option value="EUR">Euro (€ - EUR)</option>
                  </select>
                </div>

                {state?.error ? (
                  <div className="mt-4 rounded-lg border border-red-200 bg-red-50/50 px-4 py-3 text-sm text-red-700 font-medium">
                    {state.error}
                  </div>
                ) : null}

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
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

      <p className="mt-8 text-center text-sm text-slate-500">
        Already registered?{" "}
        <a href="/login" className="font-semibold text-slate-900 transition-colors hover:text-brand-600">
          Sign in to your account
        </a>
      </p>
    </div>
  );
}

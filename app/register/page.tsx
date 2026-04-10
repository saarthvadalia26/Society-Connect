import { RegistrationWizard } from "./wizard";

export const metadata = {
  title: "Register - Society Connect",
  description: "Set up your society in minutes.",
};

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen bg-slate-50">
      {/* Left: Premium Dark Marketing Panel (Deep Navy) */}
      <div className="hidden relative w-1/2 flex-col justify-between overflow-hidden bg-slate-900 bg-grid-pattern-slate p-12 text-white lg:flex">
        
        {/* Subtle glow effect behind content */}
        <div className="absolute top-0 left-0 -mt-[20%] -ml-[20%] h-[60%] w-[60%] rounded-full bg-slate-800/50 blur-[100px]" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-lg font-bold backdrop-blur-md shadow-[0_0_15px_rgba(255,255,255,0.05)] border border-white/10">
              SC
            </div>
            <span className="text-lg font-semibold tracking-wide text-slate-200">Society Connect</span>
          </div>
        </div>
        
        <div className="relative z-10 mt-24 mb-auto">
          <h2 className="text-[2.75rem] font-bold leading-[1.1] tracking-tight">
            Trust & Security <br />
            <span className="text-slate-400">for your society.</span>
          </h2>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-slate-300 font-light">
            Empower your community with a single, secure platform. Manage finances, verify visitors, and connect residents effortlessly.
          </p>
          
          <div className="mt-12 flex gap-8 text-sm text-slate-300 font-medium">
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </span>
              Bank-grade security
            </div>
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </span>
              UPI Integrated
            </div>
          </div>
        </div>
        
        <div className="relative z-10 text-sm font-medium text-slate-500 flex items-center gap-2">
          <svg className="h-4 w-4 text-slate-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
          Encrypted Data storage
        </div>
      </div>

      {/* Right: Registration Form */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 sm:px-12">
        <RegistrationWizard />
      </div>
    </main>
  );
}

export default function GuardLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div>
        <div className="h-8 w-40 rounded-lg bg-slate-200" />
        <div className="mt-2 h-4 w-72 rounded bg-slate-100" />
      </div>
      <div className="h-48 rounded-2xl border border-slate-200 bg-white" />
      <div className="h-48 rounded-2xl border border-slate-200 bg-white" />
    </div>
  );
}

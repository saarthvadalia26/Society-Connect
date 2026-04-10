export default function ResidentLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div>
        <div className="h-8 w-48 rounded-lg bg-slate-200" />
        <div className="mt-2 h-4 w-64 rounded bg-slate-100" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 rounded-2xl border border-slate-200 bg-white p-6">
            <div className="h-3 w-20 rounded bg-slate-100" />
            <div className="mt-3 h-7 w-24 rounded bg-slate-200" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="h-56 rounded-2xl border border-slate-200 bg-white" />
        <div className="h-56 rounded-2xl border border-slate-200 bg-white" />
      </div>
    </div>
  );
}

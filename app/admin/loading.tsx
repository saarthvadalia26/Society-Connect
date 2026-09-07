export default function AdminLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div>
        <div className="h-8 w-64 rounded-lg bg-slate-200 dark:bg-slate-700/50" />
        <div className="mt-2 h-4 w-96 rounded bg-slate-100 dark:bg-slate-800/50" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-6">
            <div className="h-3 w-20 rounded bg-slate-100 dark:bg-slate-800" />
            <div className="mt-3 h-7 w-24 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="mt-2 h-3 w-32 rounded bg-slate-100 dark:bg-slate-800" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="h-64 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50" />
        <div className="h-64 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50" />
      </div>
    </div>
  );
}

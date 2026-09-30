import Link from "next/link";
import { Button } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-12 text-center bg-slate-50 dark:bg-slate-950 transition-colors">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-100 text-2xl font-bold text-brand-700 dark:bg-brand-900/40 dark:text-brand-400 mb-6 shadow-md">
        404
      </div>
      <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">
        Page not found
      </h1>
      <p className="mt-3 max-w-md text-sm text-slate-500 dark:text-slate-400">
        Sorry, we couldn’t find the page you’re looking for. It may have been moved or doesn’t exist.
      </p>
      <div className="mt-8 flex items-center justify-center gap-3">
        <Link href="/">
          <Button variant="primary">Return home</Button>
        </Link>
        <Link href="/login">
          <Button variant="secondary">Go to login</Button>
        </Link>
      </div>
    </main>
  );
}

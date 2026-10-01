import { createBrowserClient } from "@supabase/ssr";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

if (!url || !key) {
  if (typeof window !== "undefined") {
    console.warn("[supabase] NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is missing");
  }
}

/**
 * Browser-side Supabase client for client components.
 * Isolated from next/headers to keep client bundles clean.
 */
export function supabaseBrowser() {
  return createBrowserClient(url, key);
}

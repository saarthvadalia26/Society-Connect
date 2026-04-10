// Supabase clients for browser, server components/actions, and middleware.
import { createClient } from "@supabase/supabase-js";
import {
  createBrowserClient,
  createServerClient,
  type CookieOptions,
} from "@supabase/ssr";
import { cookies } from "next/headers";
import type { NextRequest, NextResponse } from "next/server";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  // Fail loudly during build/dev so missing env vars don't silently bypass auth.
  console.warn("[supabase] NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is missing");
}

export function supabaseBrowser() {
  return createBrowserClient(url, key);
}

/**
 * For Server Components, Route Handlers, and Server Actions.
 * Cookie writes from inside a server component throw — we swallow that and
 * rely on server actions / route handlers to do the actual writes.
 */
export function supabaseServer() {
  const cookieStore = cookies();
  return createServerClient(url, key, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          /* server component — ignore */
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: "", ...options });
        } catch {
          /* server component — ignore */
        }
      },
    },
  });
}

/** Service-role client for admin operations (delete auth users, etc). Server-only. */
export function supabaseAdmin() {
  if (!serviceKey) return null;
  return createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
}

/** Middleware client — needs request + response to bridge cookies. */
export function supabaseMiddleware(request: NextRequest, response: NextResponse) {
  return createServerClient(url, key, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        response.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        response.cookies.set({ name, value: "", ...options });
      },
    },
  });
}

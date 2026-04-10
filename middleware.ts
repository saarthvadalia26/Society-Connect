import { NextResponse, type NextRequest } from "next/server";
import { supabaseMiddleware } from "@/lib/supabase";

export async function middleware(req: NextRequest) {
  const response = NextResponse.next({ request: { headers: req.headers } });
  const supabase = supabaseMiddleware(req, response);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = req.nextUrl;
  const isProtected =
    pathname.startsWith("/admin") || pathname.startsWith("/resident") || pathname.startsWith("/guard");

  if (isProtected && !user) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Note: we deliberately do NOT auto-redirect /login → / when authenticated.
  // The home page does its own role-based routing AND sign-out fallback if
  // the auth user has no app_users row yet — auto-redirecting here would
  // cause an infinite loop in that case.

  return response;
}

export const config = {
  matcher: ["/", "/login", "/admin/:path*", "/resident/:path*", "/guard/:path*"],
};

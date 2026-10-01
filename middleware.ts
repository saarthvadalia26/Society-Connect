import { NextResponse, type NextRequest } from "next/server";
import { supabaseMiddleware } from "@/lib/supabase";

export async function middleware(req: NextRequest) {
  const requestHeaders = new Headers(req.headers);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
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

  // Pass verified auth metadata to Server Components so they skip redundant auth API calls
  if (user) {
    requestHeaders.set("x-user-id", user.id);
    if (user.email) requestHeaders.set("x-user-email", user.email);
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  return response;
}

export const config = {
  matcher: ["/", "/admin/:path*", "/resident/:path*", "/guard/:path*"],
};

import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { authSecret } from "@/lib/auth-secret";

export async function middleware(req: NextRequest) {
  const token = await getToken({
    req,
    secret: authSecret(),
  });
  const path = req.nextUrl.pathname;

  if (path.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (path === "/" && !token) {
    const login = new URL("/login", req.url);
    login.searchParams.set("callbackUrl", path);
    return NextResponse.redirect(login);
  }

  if ((path === "/login" || path === "/signup") && token) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/dashboard/:path*", "/login", "/signup"],
};

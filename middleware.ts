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

  const isProtected =
    path === "/" ||
    path === "/profile" ||
    path === "/chats" ||
    path.startsWith("/chats/");

  if (isProtected && !token) {
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
  matcher: [
    "/",
    "/profile",
    "/chats",
    "/chats/:path*",
    "/dashboard/:path*",
    "/login",
    "/signup",
  ],
};

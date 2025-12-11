import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const isPublic =
    pathname.startsWith("/login") ||
    pathname.startsWith("/api") ||
    pathname === "/" ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/_next")
  if (isPublic) return NextResponse.next()
  const needsAuth =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/deals") ||
    pathname.startsWith("/settings")
  if (!needsAuth) return NextResponse.next()
  const hasAccess =
    req.cookies.has("sb-access-token") || req.cookies.has("sb-refresh-token")
  if (hasAccess) return NextResponse.next()
  const url = req.nextUrl.clone()
  url.pathname = "/login"
  url.searchParams.set("next", pathname)
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}

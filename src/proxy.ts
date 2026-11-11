import { NextRequest, NextResponse } from "next/server"

export function proxy(request: NextRequest) {
  const sessionCookie = request.cookies.get("better-auth.session_token")

  const protectedRoutes = ["/me", "/admin", "/lab", "/payment"]
  const isProtected = protectedRoutes.some(route =>
    request.nextUrl.pathname.startsWith(route)
  )

  if (isProtected && !sessionCookie) {
    const signinUrl = new URL("/signin", request.url)
    signinUrl.searchParams.set("callbackUrl", request.nextUrl.pathname)
    return NextResponse.redirect(signinUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/me/:path*", "/admin/:path*", "/lab/:path*", "/payment/:path*"]
}
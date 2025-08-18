import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // Public routes
    if (pathname === "/login" || pathname === "/") {
      return NextResponse.next();
    }

    // Redirect to login if not authenticated
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    const userRole = token.role as string;

    // Route protection based on roles
    if (pathname.startsWith("/dashboard")) {
      if (userRole !== "MANAGER") {
        return NextResponse.redirect(new URL("/", req.url));
      }
    }

    if (pathname.startsWith("/listing")) {
      if (userRole !== "SELLER" && userRole !== "MANAGER") {
        return NextResponse.redirect(new URL("/", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to login page even without token
        if (req.nextUrl.pathname === "/login") return true;
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: ["/dashboard/:path*", "/listing/:path*", "/login"]
};
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  // Only enforce Cloudflare Access in production.
  if (process.env.NODE_ENV !== "production") {
    return NextResponse.next();
  }
  if (!req.headers.get("cf-access-jwt-assertion")) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|.*\\.).*)"],
};

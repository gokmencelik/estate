import { NextRequest, NextResponse } from "next/server";

function getTenantFromHostname(hostname: string) {
  const host = (hostname || "").toLowerCase().trim();
  if (!host) return null;

  // If this deployment is meant for a single primary tenant (common for first customers),
  // set PRIMARY_TENANT_SLUG to force all app traffic to that tenant.
  const primary = process.env.PRIMARY_TENANT_SLUG?.toLowerCase().trim();
  if (primary) {
    // Works well on Vercel (including preview URLs) and any host.
    // If you want multi-tenant per subdomain, leave PRIMARY_TENANT_SLUG unset.
    if (host.endsWith(".vercel.app")) return primary;
  }

  // localhost dev: acme.localhost
  if (host === "localhost") return null;
  if (host.endsWith(".localhost")) {
    const sub = host.replace(".localhost", "");
    return sub && sub !== "www" ? sub : null;
  }

  // Generic: take first label as tenant (acme.domain.com -> acme)
  const parts = host.split(".");
  if (parts.length < 3) return null; // domain.com (no subdomain)
  const sub = parts[0];
  if (!sub || sub === "www") return null;
  return sub;
}

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const pathname = url.pathname;

  const mode = (process.env.APP_MODE || "").toLowerCase().trim(); // "admin" | "public" | ""
  if (mode === "admin") {
    if (pathname.startsWith("/admin") || pathname.startsWith("/api")) {
      return NextResponse.next();
    }
    const to = new URL("/admin", url);
    return NextResponse.redirect(to);
  }

  if (mode === "public") {
    if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
      return new NextResponse("Not Found", { status: 404 });
    }
  }

  const tenant = getTenantFromHostname(url.hostname);
  if (!tenant) return NextResponse.next();

  // If already path-based tenant, do nothing.
  if (pathname === `/${tenant}` || pathname.startsWith(`/${tenant}/`)) {
    return NextResponse.next();
  }

  // Avoid rewriting admin/api routes
  if (pathname.startsWith("/admin") || pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // Rewrite / -> /{tenant}, /foo -> /{tenant}/foo
  const nextUrl = url.clone();
  nextUrl.pathname = `/${tenant}${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(nextUrl);
}

export const config = {
  matcher: ["/((?!_next/|favicon.ico).*)"]
};


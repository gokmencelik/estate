import { createSupabaseAdminClient } from "@/supabase/admin";
import { createClient } from "@supabase/supabase-js";

type Body = {
  id: string;
  tenantSlug: string;
  title: string;
  description: string | null;
  price: number;
  location: string;
  status: "satilik" | "kiralik";
  features: unknown | null;
  images: string[];
};

function getAuthToken(req: Request) {
  const header = req.headers.get("authorization") || "";
  const m = header.match(/^Bearer\s+(.+)$/i);
  return m?.[1] ?? null;
}

function isAdminRole(user: any) {
  const role1 = user?.app_metadata?.role;
  const role2 = user?.user_metadata?.role;
  return role1 === "admin" || role2 === "admin" || role1 === "superadmin" || role2 === "superadmin";
}

export async function POST(req: Request) {
  try {
    const token = getAuthToken(req);
    if (!token) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anonKey) {
      return Response.json({ error: "Server misconfigured" }, { status: 500 });
    }

    const authClient = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: userData, error: userErr } = await authClient.auth.getUser(token);
    if (userErr || !userData.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!isAdminRole(userData.user)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await req.json()) as Body;
    if (!body?.id || !body?.tenantSlug || !body?.title || !body?.location) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (typeof body.price !== "number" || !Number.isFinite(body.price) || body.price < 0) {
      return Response.json({ error: "Invalid price" }, { status: 400 });
    }
    if (body.status !== "satilik" && body.status !== "kiralik") {
      return Response.json({ error: "Invalid status" }, { status: 400 });
    }

    const admin = createSupabaseAdminClient();
    const appRole = userData.user?.app_metadata?.role ?? userData.user?.user_metadata?.role ?? null;
    const isSuperadmin = appRole === "superadmin";

    // Tenant scoping:
    // - superadmin can choose tenantSlug
    // - admin/agent must use profiles.client_id (ignores provided tenantSlug)
    let clientId: string | null = null;

    if (isSuperadmin) {
      const { data: client, error: cErr } = await admin
        .from("clients")
        .select("id, slug")
        .eq("slug", body.tenantSlug)
        .maybeSingle();
      if (cErr) return Response.json({ error: cErr.message }, { status: 400 });
      if (!client) return Response.json({ error: "Tenant not found" }, { status: 404 });
      clientId = client.id;
    } else {
      const { data: profile, error: pErr } = await admin
        .from("profiles")
        .select("client_id")
        .eq("user_id", userData.user.id)
        .maybeSingle();
      if (pErr) return Response.json({ error: pErr.message }, { status: 400 });
      if (!profile?.client_id) return Response.json({ error: "Profile not configured (client_id missing)" }, { status: 400 });
      clientId = profile.client_id;
    }

    const { error: insErr } = await admin.from("properties").insert({
      id: body.id,
      client_id: clientId,
      title: body.title,
      description: body.description,
      price: body.price,
      location: body.location,
      status: body.status,
      features: body.features,
      images: body.images
    });
    if (insErr) return Response.json({ error: insErr.message }, { status: 400 });

    return Response.json({ ok: true });
  } catch (e: any) {
    return Response.json({ error: e?.message ?? "Unexpected error" }, { status: 500 });
  }
}


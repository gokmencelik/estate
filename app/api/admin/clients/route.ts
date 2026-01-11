import { createSupabaseAdminClient } from "@/supabase/admin";
import { createClient } from "@supabase/supabase-js";

type Body = {
  company_name: string;
  slug: string;
  primary_color: string | null;
  logo_url: string | null;
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
    if (!token) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anonKey) return Response.json({ error: "Server misconfigured" }, { status: 500 });
    const authClient = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: userData, error: userErr } = await authClient.auth.getUser(token);
    if (userErr || !userData.user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (!isAdminRole(userData.user)) return Response.json({ error: "Forbidden" }, { status: 403 });

    const appRole = userData.user?.app_metadata?.role ?? userData.user?.user_metadata?.role ?? null;
    if (appRole !== "superadmin") {
      return Response.json({ error: "Only superadmin can create clients" }, { status: 403 });
    }

    const body = (await req.json()) as Body;
    if (!body?.company_name || !body?.slug) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(body.slug)) {
      return Response.json({ error: "Invalid slug format" }, { status: 400 });
    }
    if (body.primary_color && !/^#[0-9a-fA-F]{6}$/.test(body.primary_color)) {
      return Response.json({ error: "Invalid primary_color" }, { status: 400 });
    }

    const admin = createSupabaseAdminClient();
    const { error } = await admin.from("clients").insert({
      company_name: body.company_name,
      slug: body.slug,
      primary_color: body.primary_color,
      logo_url: body.logo_url,
      contact_info: null
    });
    if (error) return Response.json({ error: error.message }, { status: 400 });

    return Response.json({ ok: true });
  } catch (e: any) {
    return Response.json({ error: e?.message ?? "Unexpected error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const token = getAuthToken(req);
    if (!token) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anonKey) return Response.json({ error: "Server misconfigured" }, { status: 500 });

    const authClient = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: userData, error: userErr } = await authClient.auth.getUser(token);
    if (userErr || !userData.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const admin = createSupabaseAdminClient();
    const appRole = userData.user?.app_metadata?.role ?? userData.user?.user_metadata?.role ?? null;
    const isSuperadmin = appRole === "superadmin";

    if (isSuperadmin) {
      const { data, error } = await admin
        .from("clients")
        .select("id, company_name, slug, primary_color, logo_url")
        .order("created_at", { ascending: false });
      if (error) return Response.json({ error: error.message }, { status: 400 });
      return Response.json({ clients: data ?? [] });
    }

    const { data: profile, error: pErr } = await admin
      .from("profiles")
      .select("client_id")
      .eq("user_id", userData.user.id)
      .maybeSingle();
    if (pErr) return Response.json({ error: pErr.message }, { status: 400 });
    if (!profile?.client_id) return Response.json({ clients: [] });

    const { data, error } = await admin
      .from("clients")
      .select("id, company_name, slug, primary_color, logo_url")
      .eq("id", profile.client_id)
      .maybeSingle();
    if (error) return Response.json({ error: error.message }, { status: 400 });
    return Response.json({ clients: data ? [data] : [] });
  } catch (e: any) {
    return Response.json({ error: e?.message ?? "Unexpected error" }, { status: 500 });
  }
}

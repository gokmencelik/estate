import { createSupabaseServerClient } from "@/lib/supabase/server";

export type Client = {
  id: string;
  company_name: string;
  slug: string;
  primary_color: string | null;
  logo_url: string | null;
  contact_info: unknown | null;
};

export type Property = {
  id: string;
  client_id: string;
  title: string;
  description: string | null;
  price: number;
  location: string;
  features: unknown | null;
  images: string[] | null;
  status: "satilik" | "kiralik";
  created_at?: string;
};

export async function getClientBySlug(slug: string) {
  // Server-side access (service role). Public visitors should NOT have direct DB read.
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("clients")
    .select("id, company_name, slug, primary_color, logo_url, contact_info")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data ?? null) as Client | null;
}

export async function getPropertiesByClientId(clientId: string) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("properties")
    .select("id, client_id, title, description, price, location, features, images, status, created_at")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as Property[];
}

export async function getPropertyById(id: string) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("properties")
    .select("id, client_id, title, description, price, location, features, images, status, created_at")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data ?? null) as Property | null;
}


import { PropertyCard } from "@/components/PropertyCard";
import { getClientBySlug, getPropertiesByClientId } from "@/lib/data";
import { normalizeTenantSlug } from "@/lib/tenant";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function TenantHome({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const slug = normalizeTenantSlug(tenant);
  if (!slug) notFound();

  const client = await getClientBySlug(slug);
  if (!client) notFound();

  const properties = await getPropertiesByClientId(client.id);

  return (
    <div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">İlanlar</h1>
          <p className="mt-1 text-sm text-slate-600">
            {properties.length} ilan listeleniyor
          </p>
        </div>
        <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
          Tema rengi: <span className="font-semibold text-primary">{client.primary_color ?? "default"}</span>
        </div>
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {properties.map((p) => (
          <PropertyCard
            key={p.id}
            tenant={client.slug}
            id={p.id}
            title={p.title}
            location={p.location}
            price={p.price}
            status={p.status}
            imageUrl={p.images?.[0] ?? null}
          />
        ))}
      </div>

      {properties.length === 0 ? (
        <div className="mt-10 rounded-2xl border bg-white p-6 text-sm text-slate-700">
          Henüz ilan yok. Admin panelinden ekleyebilirsin: <span className="font-medium text-primary">/admin</span>
        </div>
      ) : null}
    </div>
  );
}


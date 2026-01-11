import { FeatureList } from "@/components/FeatureList";
import { Gallery } from "@/components/Gallery";
import { getClientBySlug, getPropertyById } from "@/lib/data";
import { normalizeTenantSlug } from "@/lib/tenant";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function PropertyDetail({
  params
}: {
  params: Promise<{ tenant: string; id: string }>;
}) {
  const { tenant, id } = await params;
  const slug = normalizeTenantSlug(tenant);
  if (!slug) notFound();

  const client = await getClientBySlug(slug);
  if (!client) notFound();

  const property = await getPropertyById(id);
  if (!property || property.client_id !== client.id) notFound();

  const images = property.images ?? [];

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link href={`/${client.slug}`} className="text-sm font-medium text-slate-600 hover:text-slate-900">
            ← İlanlara dön
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">{property.title}</h1>
          <p className="mt-1 text-sm text-slate-600">{property.location}</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-slate-600">{property.status}</div>
          <div className="mt-1 text-2xl font-semibold text-primary">
            {property.price.toLocaleString("tr-TR")} ₺
          </div>
        </div>
      </div>

      <Gallery images={images} title={property.title} />

      {property.description ? (
        <section className="mt-6 rounded-2xl border bg-white p-5">
          <h2 className="text-base font-semibold">Açıklama</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{property.description}</p>
        </section>
      ) : null}

      <section className="mt-6 rounded-2xl border bg-white p-5">
        <h2 className="text-base font-semibold">Özellikler</h2>
        <FeatureList features={property.features} />
      </section>
    </div>
  );
}


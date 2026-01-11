import { getClientBySlug } from "@/lib/data";
import { hexToRgbChannels } from "@/lib/color";
import { normalizeTenantSlug } from "@/lib/tenant";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function TenantLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ tenant: string }>;
}) {
  const { tenant } = await params;
  const slug = normalizeTenantSlug(tenant);
  if (!slug) notFound();

  const client = await getClientBySlug(slug);
  if (!client) notFound();

  const fallback = "37 99 235"; // blue-600
  const primary = client.primary_color ? hexToRgbChannels(client.primary_color) : null;
  const primaryRgb = primary ?? fallback;

  return (
    <div style={{ ["--primary" as any]: primaryRgb } as React.CSSProperties}>
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href={`/${client.slug}`} className="flex items-center gap-3">
            {client.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={client.logo_url} alt={client.company_name} className="h-9 w-9 rounded-lg object-cover" />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-white">
                {client.company_name.slice(0, 1).toUpperCase()}
              </div>
            )}
            <div>
              <div className="text-sm font-semibold leading-none">{client.company_name}</div>
              <div className="mt-1 text-xs text-slate-500">Emlak Portföyü</div>
            </div>
          </Link>

          <Link
            href="/admin"
            className="rounded-xl border px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Admin
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
      <footer className="border-t bg-white">
        <div className="mx-auto max-w-6xl px-6 py-6 text-sm text-slate-600">
          © {new Date().getFullYear()} {client.company_name}
        </div>
      </footer>
    </div>
  );
}


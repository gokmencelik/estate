import Link from "next/link";

type Props = {
  tenant: string;
  id: string;
  title: string;
  location: string;
  price: number;
  status: string;
  imageUrl?: string | null;
};

export function PropertyCard({ tenant, id, title, location, price, status, imageUrl }: Props) {
  return (
    <Link
      href={`/${tenant}/properties/${id}`}
      className="group overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:shadow-md"
    >
      <div className="aspect-[4/3] w-full overflow-hidden bg-slate-100">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-slate-500">Görsel yok</div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-2 text-base font-semibold tracking-tight">{title}</h3>
          <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700">
            {status}
          </span>
        </div>
        <p className="mt-1 text-sm text-slate-600">{location}</p>
        <p className="mt-3 text-lg font-semibold text-primary">{price.toLocaleString("tr-TR")} ₺</p>
      </div>
    </Link>
  );
}


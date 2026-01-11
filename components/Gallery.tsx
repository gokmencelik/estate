export function Gallery({ images, title }: { images: string[]; title: string }) {
  if (!images.length) return null;

  return (
    <div className="mt-4">
      <div className="overflow-hidden rounded-2xl border bg-slate-50">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={images[0]} alt={title} className="aspect-[16/10] w-full object-cover" />
      </div>
      {images.length > 1 ? (
        <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
          {images.slice(1).map((url, idx) => (
            <div key={idx} className="h-20 w-28 shrink-0 overflow-hidden rounded-xl border bg-slate-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`${title} ${idx + 2}`} className="h-full w-full object-cover" />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}


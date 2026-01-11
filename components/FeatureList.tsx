function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function FeatureList({ features }: { features: unknown | null }) {
  if (!features) return null;

  if (Array.isArray(features)) {
    return (
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {features.map((f, i) => (
          <li key={i} className="rounded-lg border bg-white px-3 py-2 text-sm text-slate-700">
            {String(f)}
          </li>
        ))}
      </ul>
    );
  }

  if (isRecord(features)) {
    const entries = Object.entries(features);
    if (entries.length === 0) return null;
    return (
      <dl className="mt-4 grid gap-2 sm:grid-cols-2">
        {entries.map(([k, v]) => (
          <div key={k} className="rounded-lg border bg-white px-3 py-2">
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{k}</dt>
            <dd className="mt-1 text-sm text-slate-800">{String(v)}</dd>
          </div>
        ))}
      </dl>
    );
  }

  return (
    <p className="mt-4 text-sm text-slate-700">
      Özellikler: <span className="font-medium">{String(features)}</span>
    </p>
  );
}


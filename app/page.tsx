export default function Home() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Estate White-label SaaS</h1>
      <p className="mt-4 text-slate-600">
        Tenant siteleri için URL formatı: <code className="rounded bg-slate-100 px-1 py-0.5">/{`{tenantSlug}`}</code>
      </p>
      <p className="mt-2 text-slate-600">
        Admin paneli: <code className="rounded bg-slate-100 px-1 py-0.5">/admin</code>
      </p>
      <div className="mt-8 rounded-xl border p-5">
        <p className="text-sm text-slate-700">
          Örnek: <code className="rounded bg-slate-100 px-1 py-0.5">/acme</code>
        </p>
      </div>
    </main>
  );
}


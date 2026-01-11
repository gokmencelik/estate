"use client";

import { createSupabaseBrowserClient } from "@/supabase/client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Client = {
  id: string;
  company_name: string;
  slug: string;
  primary_color: string | null;
  logo_url: string | null;
};

export function ClientList() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [clients, setClients] = useState<Client[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        if (mounted) setError("Giriş gerekli.");
        return;
      }

      const res = await fetch("/api/admin/clients", { headers: { authorization: `Bearer ${token}` } });
      const json = (await res.json().catch(() => null)) as any;
      const data = (res.ok ? json?.clients : null) as Client[] | null;
      const error = res.ok ? null : new Error(json?.error ?? "Clients yüklenemedi");
      if (!mounted) return;
      if (error) setError(error.message);
      setClients(Array.isArray(data) ? data : []);
    })();
    return () => {
      mounted = false;
    };
  }, [supabase]);

  if (error) {
    return <div className="text-sm text-red-600">{error}</div>;
  }

  if (!clients.length) {
    return <div className="text-sm text-slate-600">Henüz client yok.</div>;
  }

  return (
    <div className="grid gap-3">
      {clients.map((c) => (
        <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white px-4 py-3">
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">{c.company_name}</div>
            <div className="mt-1 text-xs text-slate-500">
              slug: <span className="font-mono">{c.slug}</span> • primary:{" "}
              <span className="font-mono">{c.primary_color ?? "default"}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              className="rounded-xl border px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              href={`/${c.slug}`}
              target="_blank"
            >
              Siteyi Aç
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}


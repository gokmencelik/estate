"use client";

import { createSupabaseBrowserClient } from "@/supabase/client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { NewPropertyForm } from "@/app/admin/new-property-form";

export function AdminGate() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [loading, setLoading] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      if (!mounted) return;
      setIsAuthed(Boolean(session));
      setEmail(session?.user?.email ?? null);
      setLoading(false);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      setIsAuthed(Boolean(session));
      setEmail(session?.user?.email ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  if (loading) {
    return <div className="text-sm text-slate-600">Yükleniyor...</div>;
  }

  if (!isAuthed) {
    return (
      <div className="rounded-2xl border bg-white p-6">
        <h2 className="text-base font-semibold">Giriş gerekli</h2>
        <p className="mt-2 text-sm text-slate-600">
          İlan eklemek için Supabase Auth ile giriş yapmalısın. (RLS yazma işlemlerini admin role ile sınırlar.)
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Link
            href="/admin/login"
            className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:opacity-95"
          >
            Admin Login
          </Link>
          <span className="text-xs text-slate-500">
            Not: Kullanıcının app_metadata.role = &quot;admin&quot; olmalı.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between gap-3 rounded-2xl border bg-white px-5 py-4">
        <div className="text-sm text-slate-700">
          Giriş yapıldı: <span className="font-semibold">{email ?? "user"}</span>
        </div>
        <button
          type="button"
          className="rounded-xl border px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          onClick={async () => {
            await supabase.auth.signOut();
          }}
        >
          Çıkış
        </button>
      </div>

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <NewPropertyForm />
      </div>
    </div>
  );
}


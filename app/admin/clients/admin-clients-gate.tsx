"use client";

import { createSupabaseBrowserClient } from "@/supabase/client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export function AdminClientsGate({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [loading, setLoading] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setIsAuthed(Boolean(data.session));
      setLoading(false);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      setIsAuthed(Boolean(session));
      setLoading(false);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  if (loading) return <div className="text-sm text-slate-600">Yükleniyor...</div>;

  if (!isAuthed) {
    return (
      <div className="rounded-2xl border bg-white p-6">
        <h2 className="text-base font-semibold">Giriş gerekli</h2>
        <p className="mt-2 text-sm text-slate-600">Client yönetimi için admin girişi yapmalısın.</p>
        <div className="mt-4">
          <Link
            href="/admin/login"
            className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:opacity-95"
          >
            Admin Login
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}


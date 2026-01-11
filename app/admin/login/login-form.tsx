"use client";

import { createSupabaseBrowserClient } from "@/supabase/client";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

export function LoginForm() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="grid gap-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
          const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
          if (signInErr) throw new Error(signInErr.message);
          router.push("/admin");
        } catch (err: any) {
          setError(err?.message ?? "Giriş başarısız");
        } finally {
          setLoading(false);
        }
      }}
    >
      <div className="grid gap-2">
        <label className="text-sm font-medium">E-posta</label>
        <input
          type="email"
          required
          className="w-full rounded-xl border px-3 py-2 text-sm focus:ring-2 focus:ring-primary/30"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <label className="text-sm font-medium">Şifre</label>
        <input
          type="password"
          required
          className="w-full rounded-xl border px-3 py-2 text-sm focus:ring-2 focus:ring-primary/30"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

      <button
        type="submit"
        disabled={loading}
        className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-60"
      >
        {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
      </button>
    </form>
  );
}


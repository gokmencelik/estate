"use client";

import { useForm } from "react-hook-form";
import { createSupabaseBrowserClient } from "@/supabase/client";
import { useMemo, useState } from "react";

type FormValues = {
  company_name: string;
  slug: string;
  primary_color: string;
  logo_url: string;
};

export function ClientForm() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({
    defaultValues: { primary_color: "#2563eb" }
  });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) {
      setError("Giriş gerekli.");
      return;
    }

    const res = await fetch("/api/admin/clients", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(token ? { authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        company_name: values.company_name,
        slug: values.slug,
        primary_color: values.primary_color || null,
        logo_url: values.logo_url || null
      })
    });

    const json = (await res.json().catch(() => null)) as any;
    if (!res.ok) {
      setError(json?.error ?? "Client eklenemedi");
      return;
    }

    reset();
    window.location.reload();
  });

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <label className="text-sm font-medium">Company Name</label>
        <input
          className="w-full rounded-xl border px-3 py-2 text-sm focus:ring-2 focus:ring-primary/30"
          {...register("company_name", { required: "Zorunlu" })}
        />
        {errors.company_name ? <p className="text-sm text-red-600">{errors.company_name.message}</p> : null}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="grid gap-2">
          <label className="text-sm font-medium">Slug</label>
          <input
            className="w-full rounded-xl border px-3 py-2 text-sm focus:ring-2 focus:ring-primary/30"
            placeholder="acme"
            {...register("slug", {
              required: "Zorunlu",
              pattern: {
                value: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
                message: 'Sadece küçük harf, rakam ve "-" kullan.'
              }
            })}
          />
          {errors.slug ? <p className="text-sm text-red-600">{errors.slug.message}</p> : null}
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium">Primary Color (hex)</label>
          <input
            className="w-full rounded-xl border px-3 py-2 font-mono text-sm focus:ring-2 focus:ring-primary/30"
            placeholder="#2563eb"
            {...register("primary_color", {
              pattern: { value: /^#[0-9a-fA-F]{6}$/, message: "Hex format: #RRGGBB" }
            })}
          />
          {errors.primary_color ? <p className="text-sm text-red-600">{errors.primary_color.message}</p> : null}
        </div>
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium">Logo URL (opsiyonel)</label>
        <input
          className="w-full rounded-xl border px-3 py-2 text-sm focus:ring-2 focus:ring-primary/30"
          placeholder="https://..."
          {...register("logo_url")}
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-60"
      >
        {isSubmitting ? "Kaydediliyor..." : "Client Ekle"}
      </button>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}
    </form>
  );
}


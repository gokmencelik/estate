"use client";

import { createSupabaseBrowserClient } from "@/supabase/client";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

type FormValues = {
  tenantSlug: string;
  title: string;
  description: string;
  price: number;
  location: string;
  status: "satilik" | "kiralik";
  featuresJson: string;
  images: FileList;
};

type ClientOption = { slug: string; company_name: string };

function toSafeSlug(input: string) {
  // Storage + URL safe: lowercase ascii + hyphen
  return (input || "")
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toSafeFilename(input: string) {
  return (input || "")
    .trim()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replaceAll("/", "_")
    .replace(/[^\w.\-]+/g, "_");
}

function safeJsonParse(input: string): unknown | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    return "__invalid_json__";
  }
}

export function NewPropertyForm() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [clientsLoaded, setClientsLoaded] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm<FormValues>({
    defaultValues: { status: "satilik", featuresJson: "[]" }
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        if (mounted) {
          setClients([]);
          setClientsLoaded(true);
        }
        return;
      }

      const res = await fetch("/api/admin/clients", { headers: { authorization: `Bearer ${token}` } });
      const json = (await res.json().catch(() => null)) as any;
      const list = (res.ok ? json?.clients : []) as ClientOption[] | undefined;
      const data = Array.isArray(list) ? list : [];
      const error = res.ok ? null : new Error(json?.error ?? "Clients yüklenemedi");
      if (!mounted) return;
      if (error) {
        // public read should be allowed; if not, we just skip dropdown
        setClients([]);
      } else {
        setClients((data ?? []) as ClientOption[]);
      }
      setClientsLoaded(true);

      // If user is scoped to exactly one tenant, auto-fill it.
      if ((data ?? []).length === 1) {
        const only = (data ?? [])[0] as any;
        if (only?.slug) setValue("tenantSlug", String(only.slug), { shouldValidate: true });
      }
    })();
    return () => {
      mounted = false;
    };
  }, [supabase]);

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    setSuccess(null);

    const parsedFeatures = safeJsonParse(values.featuresJson);
    if (parsedFeatures === "__invalid_json__") {
      setServerError("Features JSON geçersiz. Örn: [] veya {\"oda\":3}");
      return;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) {
      setServerError("Admin işlemleri için giriş yapmış bir kullanıcı gerekir (Supabase Auth).");
      return;
    }

    const safeTenantSlug = toSafeSlug(values.tenantSlug);
    if (!safeTenantSlug) {
      setServerError("Tenant Slug geçersiz. Örn: acme veya kiralik-daire");
      return;
    }
    if (safeTenantSlug !== values.tenantSlug.trim().toLowerCase()) {
      setServerError(`Tenant Slug slug formatında olmalı. Örn: ${safeTenantSlug}`);
      return;
    }
    if (clientsLoaded && clients.length) {
      const allowed = new Set(clients.map((c) => c.slug));
      if (!allowed.has(safeTenantSlug)) {
        setServerError("Bu kullanıcı bu tenant için işlem yapamaz (client scope).");
        return;
      }
    }

    const propertyId = crypto.randomUUID();
    const bucket = "property-images";
    const files = Array.from(values.images ?? []);

    setUploading(true);
    try {
      const imageUrls: string[] = [];
      for (const file of files) {
        const safeName = toSafeFilename(file.name);
        const path = `${safeTenantSlug}/${propertyId}/${Date.now()}-${safeName}`;
        const { error: upErr } = await supabase.storage.from(bucket).upload(path, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type
        });
        if (upErr) throw new Error(`Upload error: ${upErr.message}`);

        const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
        imageUrls.push(pub.publicUrl);
      }

      const res = await fetch("/api/admin/properties", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          id: propertyId,
          tenantSlug: safeTenantSlug,
          title: values.title,
          description: values.description || null,
          price: Number(values.price),
          location: values.location,
          status: values.status,
          features: parsedFeatures,
          images: imageUrls
        })
      });

      const json = (await res.json().catch(() => null)) as any;
      if (!res.ok) {
        throw new Error(json?.error ?? "İlan eklenemedi.");
      }

      setSuccess("İlan eklendi. Tenant sayfasında görüntüleyebilirsin.");
    } catch (e: any) {
      setServerError(e?.message ?? "Beklenmeyen hata");
    } finally {
      setUploading(false);
    }
  });

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <label className="text-sm font-medium">Tenant Slug</label>
        {clientsLoaded && clients.length ? (
          <div className="grid gap-2">
            <select
              className="w-full rounded-xl border bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary/30"
              defaultValue=""
              onChange={(e) => {
                const v = e.target.value;
                if (v) setValue("tenantSlug", v, { shouldValidate: true, shouldDirty: true });
              }}
            >
              <option value="" disabled>
                Tenant seç (clients tablosundan)
              </option>
              {clients.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.company_name} ({c.slug})
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-500">
              Bu liste Supabase `clients` tablosundan gelir. Tenant yoksa önce `clients` tablosuna ekle.
            </p>
          </div>
        ) : null}
        <input
          className="w-full rounded-xl border px-3 py-2 text-sm focus:ring-2 focus:ring-primary/30 disabled:bg-slate-50"
          placeholder="acme"
          disabled={clientsLoaded && clients.length === 1}
          {...register("tenantSlug", {
            required: "Zorunlu",
            pattern: {
              value: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
              message: 'Sadece küçük harf, rakam ve "-" kullan. Örn: kiralik-daire'
            }
          })}
        />
        {errors.tenantSlug ? <p className="text-sm text-red-600">{errors.tenantSlug.message}</p> : null}
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium">Başlık</label>
        <input
          className="w-full rounded-xl border px-3 py-2 text-sm focus:ring-2 focus:ring-primary/30"
          placeholder="3+1 Deniz Manzaralı Daire"
          {...register("title", { required: "Zorunlu" })}
        />
        {errors.title ? <p className="text-sm text-red-600">{errors.title.message}</p> : null}
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium">Lokasyon</label>
        <input
          className="w-full rounded-xl border px-3 py-2 text-sm focus:ring-2 focus:ring-primary/30"
          placeholder="İstanbul / Kadıköy"
          {...register("location", { required: "Zorunlu" })}
        />
        {errors.location ? <p className="text-sm text-red-600">{errors.location.message}</p> : null}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="grid gap-2">
          <label className="text-sm font-medium">Fiyat (₺)</label>
          <input
            type="number"
            className="w-full rounded-xl border px-3 py-2 text-sm focus:ring-2 focus:ring-primary/30"
            {...register("price", { required: "Zorunlu", valueAsNumber: true, min: { value: 0, message: "Geçersiz" } })}
          />
          {errors.price ? <p className="text-sm text-red-600">{errors.price.message}</p> : null}
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium">Durum</label>
          <select
            className="w-full rounded-xl border px-3 py-2 text-sm focus:ring-2 focus:ring-primary/30"
            {...register("status", { required: true })}
          >
            <option value="satilik">Satılık</option>
            <option value="kiralik">Kiralık</option>
          </select>
        </div>
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium">Açıklama</label>
        <textarea
          className="min-h-28 w-full rounded-xl border px-3 py-2 text-sm focus:ring-2 focus:ring-primary/30"
          {...register("description")}
        />
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium">Features (JSON)</label>
        <textarea
          className="min-h-24 w-full rounded-xl border px-3 py-2 font-mono text-xs focus:ring-2 focus:ring-primary/30"
          {...register("featuresJson")}
        />
        <p className="text-xs text-slate-500">
          Örn: [&quot;asansör&quot;,&quot;otopark&quot;] veya {"{"}&quot;oda&quot;:3,&quot;m2&quot;:120{"}"}
        </p>
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium">Fotoğraflar</label>
        <input type="file" multiple accept="image/*" {...register("images")} />
        <p className="text-xs text-slate-500">Yüklenen görseller: Supabase Storage / property-images</p>
      </div>

      {serverError ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{serverError}</div> : null}
      {success ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div> : null}

      <button
        type="submit"
        disabled={uploading}
        className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-60"
      >
        {uploading ? "Yükleniyor..." : "İlanı Kaydet"}
      </button>
    </form>
  );
}


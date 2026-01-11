# White-label Real Estate SaaS (Next.js + Supabase)

Tek bir kod tabanı ile farklı emlak ofisleri (tenant/client) için farklı tema renkleriyle çalışan emlak sitesi altyapısı.

## URL Yapısı (Tenant Routing)

- Tenant site: `/{tenantSlug}` (örn: `/acme`)
- İlan detay: `/{tenantSlug}/properties/{id}`
- Admin panel: `/admin`
- Admin login: `/admin/login`

> `tenantSlug` değerini `clients.slug` alanından alıyoruz.

## Subdomain ile White-label (Önerilen)

Projede `middleware.ts` sayesinde şu da çalışır:

- `acme.localhost:3000`  → otomatik `/{tenantSlug}` gibi davranır
- `acme.senin-domainin.com` → otomatik `/{tenantSlug}` gibi davranır

Yani prod’da kullanıcılar kendi subdomain’leriyle tenant sitesini görür.

## İlk müşteri için (GM İnşaat) Vercel deploy

İlk müşteri için hedef domain: `gminsaat.vercel.app`.

- Supabase `clients` tablosunda bir kayıt oluştur:
  - `company_name`: `GM İnşaat`
  - `slug`: `gminsaat`
  - `primary_color`: örn `#16a34a`
  - `logo_url`: opsiyonel
- Vercel’de proje adı `gminsaat` olursa otomatik `gminsaat.vercel.app` oluşur.
- Vercel Environment Variables:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `PRIMARY_TENANT_SLUG=gminsaat` (bu deployment’ı tek tenant gibi davranmaya zorlar; preview URL’lerde de bozulmaz)

## Kurulum

1) Bağımlılıklar:

```bash
npm install
```

2) Ortam değişkenleri:

- `env.example` dosyasını referans alıp `.env.local` oluştur.

Gerekli env:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only; admin insert API için)

3) Supabase DB:

- Supabase SQL Editor’de `supabase/schema.sql` dosyasını çalıştır.
- (Opsiyonel) seed için `supabase/seed.sql` çalıştır.

4) Dev server:

```bash
npm run dev
```

## Dinamik Tema (Tailwind + CSS Variables)

- Tailwind’de `primary` rengi `rgb(var(--primary) / <alpha-value>)` olarak tanımlı.
- Tenant layout (`app/(tenant)/[tenant]/layout.tsx`) DB’den gelen `clients.primary_color` (hex) değerini `--primary` kanal değerlerine çevirip sayfaya uygular.

Bu sayede `bg-primary`, `text-primary`, `ring-primary/30` gibi sınıflar tenant’a göre otomatik değişir.

## Admin Yazma Yetkisi (RLS)

- SQL tarafında admin yazma işlemleri `public.is_admin()` fonksiyonuna bakar.
- Admin kullanıcı için Supabase Auth’ta `app_metadata.role = "admin"` set edilmelidir.
- Admin panel formu Storage’a yükler, sonra `/api/admin/properties` ile DB insert yapar.

## Multi-tenant izolasyon (GM vs X birbirinin verisini görmesin)

Varsayılan demo şema “public read” olduğu için multi-tenant izolasyon sağlamaz. Gerçek SaaS için:

- Supabase SQL Editor’de `supabase/isolation.sql` dosyasını çalıştır.
- Sonra her admin kullanıcıyı bir client’a bağla (profiles):
  - `profiles.user_id` = auth user id
  - `profiles.client_id` = clients.id
  - `profiles.role` = `admin` veya `agent`

Bu sayede:
- GM admin’i sadece GM ilanlarını görür/yazar
- X admin’i sadece X ilanlarını görür/yazar
- Public site verisi DB’den direkt okunmaz; Next.js server tarafı (service role) tenant’a göre filtreli getirir.

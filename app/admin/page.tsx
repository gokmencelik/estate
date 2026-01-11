import { AdminGate } from "@/app/admin/admin-gate";

export const dynamic = "force-dynamic";

export default function AdminPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-slate-600">Yeni ilan ekle ve görselleri Supabase Storage’a yükle.</p>
        </div>
      </div>

      <div className="mt-6">
        <AdminGate />
      </div>
    </main>
  );
}


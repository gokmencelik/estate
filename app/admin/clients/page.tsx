import { ClientForm } from "@/app/admin/clients/client-form";
import { ClientList } from "@/app/admin/clients/client-list";
import { AdminClientsGate } from "@/app/admin/clients/admin-clients-gate";

export const dynamic = "force-dynamic";

export default function AdminClientsPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Clients (Tenant) Yönetimi</h1>
          <p className="mt-1 text-sm text-slate-600">Yeni emlak ofisi ekle, tema rengi ve logo ayarla.</p>
        </div>
      </div>

      <div className="mt-6 grid gap-6">
        <AdminClientsGate>
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold">Yeni Client</h2>
            <div className="mt-4">
              <ClientForm />
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold">Mevcut Clients</h2>
            <div className="mt-4">
              <ClientList />
            </div>
          </div>
        </AdminClientsGate>
      </div>
    </main>
  );
}


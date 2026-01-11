import Link from "next/link";
import { LoginForm } from "@/app/admin/login/login-form";

export const dynamic = "force-dynamic";

export default function AdminLoginPage() {
  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <Link href="/" className="text-sm font-medium text-slate-600 hover:text-slate-900">
        ← Ana sayfa
      </Link>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight">Admin Login</h1>
      <p className="mt-2 text-sm text-slate-600">
        Supabase Auth (email/password) ile giriş yap.
      </p>

      <div className="mt-6 rounded-2xl border bg-white p-6 shadow-sm">
        <LoginForm />
      </div>
    </main>
  );
}


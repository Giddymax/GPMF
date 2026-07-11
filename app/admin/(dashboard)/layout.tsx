import { redirect } from "next/navigation";

import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminTopbar } from "@/components/admin/topbar";
import { getStaffSession } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/data/public";

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  // When no Supabase project is connected, middleware can't verify a session either —
  // let the portal render in "preview" mode instead of bouncing to a login page that
  // has nothing to authenticate against.
  const session = isSupabaseConfigured() ? await getStaffSession() : null;
  if (isSupabaseConfigured() && !session) {
    redirect("/admin/login");
  }

  const name = session?.profile.full_name ?? "Preview user";
  const role = session?.profile.role ?? "admin";

  return (
    <div className="dark flex min-h-screen bg-navy-900 text-white print:block print:bg-white print:text-black">
      <AdminSidebar className="print:hidden" />
      <div className="flex min-w-0 flex-1 flex-col print:block">
        <AdminTopbar name={name} role={role} className="print:hidden" />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 print:overflow-visible print:p-0">{children}</main>
      </div>
    </div>
  );
}

import { requireAdmin } from "@/lib/auth";
import { get } from "@/lib/db";
import { AdminNav } from "./AdminNav";

export const metadata = { title: "Admin" };

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  await requireAdmin();
  const { pending } = get<{ pending: number }>(
    "SELECT COUNT(*) AS pending FROM topups WHERE status = 'pending'",
  )!;
  return (
    <div className="space-y-5 sm:space-y-6">
      <AdminNav pendingFunding={pending} />
      {children}
    </div>
  );
}

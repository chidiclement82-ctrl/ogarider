import Link from "next/link";
import { requireAdmin } from "@/lib/auth";

export const metadata = { title: "Admin" };

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  await requireAdmin();
  const tab = "rounded-full px-4 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-200";
  return (
    <div className="space-y-6">
      <nav className="flex flex-wrap items-center gap-1 border-b border-stone-200 pb-4" aria-label="Admin">
        <span className="mr-3 text-xs font-semibold uppercase tracking-wide text-stone-500">Admin</span>
        <Link href="/admin" className={tab}>
          Restaurants
        </Link>
        <Link href="/admin/orders" className={tab}>
          Orders
        </Link>
        <Link href="/admin/restaurants/new" className="btn ml-auto">
          + Add restaurant
        </Link>
      </nav>
      {children}
    </div>
  );
}

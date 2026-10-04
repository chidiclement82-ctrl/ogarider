import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { get } from "@/lib/db";

export const metadata = { title: "Admin" };

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  await requireAdmin();
  const { pending } = get<{ pending: number }>(
    "SELECT COUNT(*) AS pending FROM topups WHERE status = 'pending'",
  )!;
  const tab = "rounded-full px-4 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-200";
  return (
    <div className="space-y-6">
      <nav
        className="-mx-4 flex items-center gap-1 overflow-x-auto whitespace-nowrap border-b border-stone-200 px-4 pb-4"
        aria-label="Admin"
      >
        <span className="mr-3 text-xs font-semibold uppercase tracking-wide text-stone-500">Admin</span>
        <Link href="/admin" className={tab}>
          Restaurants
        </Link>
        <Link href="/admin/orders" className={tab}>
          Orders
        </Link>
        <Link href="/admin/funding" className={tab}>
          Wallet funding
          {pending > 0 && (
            <span className="ml-1.5 inline-grid min-w-5 place-items-center rounded-full bg-orange-600 px-1.5 text-xs font-semibold text-white">
              {pending}
            </span>
          )}
        </Link>
        <Link href="/admin/settings" className={tab}>
          Bank account
        </Link>
        <Link href="/admin/restaurants/new" className="btn ml-auto shrink-0">
          + Add restaurant
        </Link>
      </nav>
      {children}
    </div>
  );
}

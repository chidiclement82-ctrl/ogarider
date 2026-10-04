import Link from "next/link";
import { Picture } from "@/components/Picture";
import { requireAdmin } from "@/lib/auth";
import { all, get, type Restaurant } from "@/lib/db";
import { money } from "@/lib/format";
import { toggleRestaurantOpen } from "./actions";

type Row = Restaurant & { dishes: number; orders: number };

export default async function AdminHome() {
  await requireAdmin();
  const restaurants = all<Row>(
    `SELECT r.*,
            (SELECT COUNT(*) FROM menu_items WHERE restaurant_id = r.id) AS dishes,
            (SELECT COUNT(*) FROM orders WHERE restaurant_id = r.id) AS orders
       FROM restaurants r
      WHERE r.archived = 0
      ORDER BY r.name`,
  );
  const totals = get<{ orders: number; delivered: number; sales: number; customers: number }>(
    `SELECT (SELECT COUNT(*) FROM orders) AS orders,
            (SELECT COUNT(*) FROM orders WHERE status = 'delivered') AS delivered,
            (SELECT COALESCE(SUM(total), 0) FROM orders WHERE status = 'delivered') AS sales,
            (SELECT COUNT(*) FROM users WHERE role = 'customer') AS customers`,
  )!;
  const stats = [
    ["Restaurants", restaurants.length],
    ["Customers", totals.customers],
    ["Orders", totals.orders],
    ["Delivered sales", money(totals.sales)],
  ] as const;

  return (
    <div className="space-y-6">
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map(([label, value]) => (
          <div key={label} className="card p-4">
            <dt className="text-sm text-stone-500">{label}</dt>
            <dd className="mt-1 text-2xl font-bold tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>

      <h1 className="text-xl font-bold tracking-tight">Restaurants</h1>
      {restaurants.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-stone-500">No restaurants yet.</p>
          <Link href="/admin/restaurants/new" className="btn mt-4">
            Add your first restaurant
          </Link>
        </div>
      ) : (
        <ul className="card divide-y divide-stone-100">
          {restaurants.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center gap-4 p-4">
              <Picture
                image={r.image}
                emoji={r.emoji}
                color={r.color}
                className="size-14 shrink-0 rounded-xl text-2xl"
              />
              <div className="min-w-40 flex-1">
                <p className="font-medium">{r.name}</p>
                <p className="text-sm text-stone-500">
                  {r.cuisine} · {r.dishes} {r.dishes === 1 ? "dish" : "dishes"} · {r.orders}{" "}
                  {r.orders === 1 ? "order" : "orders"} · {money(r.delivery_fee)} delivery
                </p>
              </div>
              <form action={toggleRestaurantOpen}>
                <input type="hidden" name="restaurantId" value={r.id} />
                <button
                  className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                    r.is_open ? "bg-emerald-100 text-emerald-800" : "bg-stone-200 text-stone-600"
                  }`}
                  title={r.is_open ? "Click to close" : "Click to open"}
                >
                  {r.is_open ? "Open" : "Closed"}
                </button>
              </form>
              <Link href={`/admin/restaurants/${r.id}`} className="btn-ghost">
                Edit details &amp; menu
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

import Link from "next/link";
import { advanceOrder, toggleOpen } from "@/app/actions";
import { AutoRefresh } from "@/components/AutoRefresh";
import { requireOwner } from "@/lib/auth";
import { all, VISIBLE_TO_RESTAURANT, type Order, type OrderItem } from "@/lib/db";
import {
  money,
  paymentLabel,
  STATUS_LABEL,
  STATUS_STYLE,
  timeAgo,
  type OrderStatus,
} from "@/lib/format";

export const metadata = { title: "Restaurant dashboard" };

const NEXT_ACTION: Partial<Record<OrderStatus, string>> = {
  pending: "Accept order",
  accepted: "Start preparing",
  preparing: "Send out for delivery",
  out_for_delivery: "Mark delivered",
};

type Row = Order & { customer_name: string };

export default async function DashboardPage() {
  const { restaurant } = await requireOwner();
  const orders = all<Row>(
    `SELECT o.*, u.name AS customer_name
       FROM orders o JOIN users u ON u.id = o.user_id
      WHERE o.restaurant_id = ? AND ${VISIBLE_TO_RESTAURANT}
      ORDER BY o.id DESC LIMIT 100`,
    restaurant.id,
  );
  const items = all<OrderItem>(
    `SELECT oi.* FROM order_items oi JOIN orders o ON o.id = oi.order_id
      WHERE o.restaurant_id = ? AND ${VISIBLE_TO_RESTAURANT}`,
    restaurant.id,
  );
  const itemsByOrder = Map.groupBy(items, (i) => i.order_id);

  const active = orders.filter((o) => o.status !== "delivered" && o.status !== "cancelled");
  const past = orders.filter((o) => o.status === "delivered" || o.status === "cancelled");
  const delivered = orders.filter((o) => o.status === "delivered");
  const stats = [
    ["New", orders.filter((o) => o.status === "pending").length],
    ["In progress", active.length - orders.filter((o) => o.status === "pending").length],
    ["Delivered", delivered.length],
    ["Revenue", money(delivered.reduce((sum, o) => sum + o.subtotal, 0))],
  ] as const;

  return (
    <div className="space-y-8">
      <AutoRefresh seconds={8} />

      <header className="flex flex-wrap items-center gap-3">
        <div className="mr-auto">
          <p className="text-sm text-stone-500">Restaurant dashboard</p>
          <h1 className="text-2xl font-bold tracking-tight">
            {restaurant.emoji} {restaurant.name}
          </h1>
        </div>
        <Link href="/dashboard/menu" className="btn-ghost">
          Manage menu
        </Link>
        <form action={toggleOpen}>
          <button className={restaurant.is_open ? "btn-ghost" : "btn"}>
            {restaurant.is_open ? "Open · stop taking orders" : "Closed · start taking orders"}
          </button>
        </form>
      </header>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map(([label, value]) => (
          <div key={label} className="card p-4">
            <dt className="text-sm text-stone-500">{label}</dt>
            <dd className="mt-1 text-2xl font-bold tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Active orders</h2>
        {active.length === 0 ? (
          <p className="card p-10 text-center text-stone-500">
            No active orders. New orders appear here automatically.
          </p>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {active.map((o) => (
              <li key={o.id} className="card flex flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">
                      #{o.id} · {o.customer_name}
                    </p>
                    <p className="text-sm text-stone-500">{timeAgo(o.created_at)}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLE[o.status]}`}>
                    {STATUS_LABEL[o.status]}
                  </span>
                </div>
                <ul className="mt-3 space-y-1 text-sm">
                  {(itemsByOrder.get(o.id) ?? []).map((item) => (
                    <li key={item.id}>
                      <span className="font-medium">{item.qty} ×</span> {item.name}
                    </li>
                  ))}
                </ul>
                {o.notes && (
                  <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
                    Note: {o.notes}
                  </p>
                )}
                <p className="mt-3 text-sm text-stone-500">
                  {o.address} · {o.phone}
                </p>
                <div className="mt-4 flex items-center gap-2 border-t border-stone-100 pt-4">
                  <span className="mr-auto">
                    <span className="block font-semibold">{money(o.total)}</span>
                    <span className="text-xs text-stone-500">{paymentLabel(o)}</span>
                  </span>
                  <form action={advanceOrder} className="flex gap-2">
                    <input type="hidden" name="orderId" value={o.id} />
                    {o.status === "pending" && (
                      <button name="intent" value="reject" className="btn-ghost">
                        Reject
                      </button>
                    )}
                    <button name="intent" value="advance" className="btn">
                      {NEXT_ACTION[o.status]}
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {past.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Past orders</h2>
          <ul className="card divide-y divide-stone-100 text-sm">
            {past.map((o) => (
              <li key={o.id} className="flex items-center gap-3 px-5 py-3">
                <span className="w-12 text-stone-500">#{o.id}</span>
                <span className="min-w-0 flex-1 truncate">{o.customer_name}</span>
                <span className="text-stone-500">{timeAgo(o.created_at)}</span>
                <span className="w-20 text-right tabular-nums">{money(o.total)}</span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLE[o.status]}`}>
                  {STATUS_LABEL[o.status]}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

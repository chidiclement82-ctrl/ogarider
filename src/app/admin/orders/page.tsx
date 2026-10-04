import { AutoRefresh } from "@/components/AutoRefresh";
import { requireAdmin } from "@/lib/auth";
import { all, type Order } from "@/lib/db";
import {
  awaitingPayment,
  money,
  orderLabel,
  orderStyle,
  paymentLabel,
  timeAgo,
  type OrderStatus,
} from "@/lib/format";
import { adminAdvanceOrder } from "../actions";

export const metadata = { title: "All orders" };

const NEXT_ACTION: Partial<Record<OrderStatus, string>> = {
  pending: "Accept",
  accepted: "Start preparing",
  preparing: "Send out",
  out_for_delivery: "Mark delivered",
};

type Row = Order & { customer_name: string; restaurant_name: string; items: string };

export default async function AdminOrdersPage() {
  await requireAdmin();
  const orders = all<Row>(
    `SELECT o.*, u.name AS customer_name, r.name AS restaurant_name,
            (SELECT GROUP_CONCAT(qty || ' × ' || name, ', ') FROM order_items WHERE order_id = o.id) AS items
       FROM orders o
       JOIN users u ON u.id = o.user_id
       JOIN restaurants r ON r.id = o.restaurant_id
      ORDER BY o.id DESC LIMIT 200`,
  );

  return (
    <div className="space-y-4">
      <AutoRefresh seconds={10} />
      <h1 className="text-xl font-bold tracking-tight">All orders</h1>
      {orders.length === 0 ? (
        <p className="card p-10 text-center text-stone-500">No orders yet.</p>
      ) : (
        <ul className="space-y-3">
          {orders.map((o) => (
            <li key={o.id} className="card flex flex-wrap items-center gap-x-6 gap-y-3 p-4">
              <div className="min-w-56 flex-1">
                <p className="font-medium">
                  #{o.id} · {o.restaurant_name}
                </p>
                <p className="text-sm text-stone-600">{o.items}</p>
                <p className="mt-1 text-sm text-stone-500">
                  {o.customer_name} · {o.phone} · {o.address} · {timeAgo(o.created_at)}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold tabular-nums">{money(o.total)}</p>
                <p className="text-xs text-stone-500">{paymentLabel(o)}</p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${orderStyle(o)}`}>
                {orderLabel(o)}
              </span>
              {NEXT_ACTION[o.status] && !awaitingPayment(o) && (
                <form action={adminAdvanceOrder} className="flex gap-2">
                  <input type="hidden" name="orderId" value={o.id} />
                  {o.status === "pending" && (
                    <button name="intent" value="reject" className="btn-ghost">
                      Reject
                    </button>
                  )}
                  <button name="intent" value="advance" className="btn-ghost">
                    {NEXT_ACTION[o.status]}
                  </button>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

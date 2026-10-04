import Link from "next/link";
import { Picture } from "@/components/Picture";
import { requireUser } from "@/lib/auth";
import { all, type Order } from "@/lib/db";
import { money, orderLabel, orderStyle, timeAgo } from "@/lib/format";

export const metadata = { title: "Your orders" };

type Row = Order & { restaurant_name: string; emoji: string; color: string; image: string; item_count: number };

export default async function OrdersPage() {
  const user = await requireUser("/orders");
  const orders = all<Row>(
    `SELECT o.*, r.name AS restaurant_name, r.emoji, r.color, r.image,
            (SELECT SUM(qty) FROM order_items WHERE order_id = o.id) AS item_count
       FROM orders o JOIN restaurants r ON r.id = o.restaurant_id
      WHERE o.user_id = ?
      ORDER BY o.id DESC`,
    user.id,
  );

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Your orders</h1>
      {orders.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-stone-500">You have not ordered anything yet.</p>
          <Link href="/" className="btn mt-4">
            Browse restaurants
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {orders.map((o) => (
            <li key={o.id}>
              <Link href={`/orders/${o.id}`} className="card flex items-center gap-4 p-4 hover:shadow-md">
                <Picture
                  image={o.image}
                  emoji={o.emoji}
                  color={o.color}
                  className="size-12 shrink-0 rounded-xl text-2xl"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{o.restaurant_name}</p>
                  <p className="text-sm text-stone-500">
                    {o.item_count} {o.item_count === 1 ? "item" : "items"} · {money(o.total)} ·{" "}
                    {timeAgo(o.created_at)}
                  </p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${orderStyle(o)}`}>
                  {orderLabel(o)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

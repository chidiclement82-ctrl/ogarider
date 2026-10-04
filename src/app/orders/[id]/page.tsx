import Link from "next/link";
import { notFound } from "next/navigation";
import { cancelOrder, payNow } from "@/app/actions";
import { AutoRefresh } from "@/components/AutoRefresh";
import { requireUser } from "@/lib/auth";
import { all, get, type Order, type OrderItem } from "@/lib/db";
import { awaitingPayment, money, ORDER_STEPS, orderLabel, paymentLabel } from "@/lib/format";

const STEP_NAME = ["Placed", "Accepted", "Preparing", "On the way", "Delivered"];

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ pay?: string }>;
}) {
  const { id } = await params;
  const { pay } = await searchParams;
  const user = await requireUser(`/orders/${id}`);
  const order = get<Order & { restaurant_name: string; eta_minutes: number }>(
    `SELECT o.*, r.name AS restaurant_name, r.eta_minutes
       FROM orders o JOIN restaurants r ON r.id = o.restaurant_id
      WHERE o.id = ? AND o.user_id = ?`,
    Number(id),
    user.id,
  );
  if (!order) notFound();

  const items = all<OrderItem>("SELECT * FROM order_items WHERE order_id = ?", order.id);
  const cancelled = order.status === "cancelled";
  const unpaid = awaitingPayment(order);
  const cancellable = !order.paid || order.payment_method === "wallet";
  const step = cancelled || unpaid ? -1 : ORDER_STEPS.indexOf(order.status as (typeof ORDER_STEPS)[number]);
  const live = !cancelled && order.status !== "delivered";

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      {live && <AutoRefresh />}
      <Link href="/orders" className="text-sm text-stone-500 hover:text-stone-900">
        ← Your orders
      </Link>

      <section className="card p-6">
        <p className="text-sm text-stone-500">
          Order #{order.id} · {order.restaurant_name}
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">{orderLabel(order)}</h1>

        {unpaid ? (
          <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
            {pay === "failed"
              ? "The payment did not go through. You have not been charged."
              : "This order has not been paid for yet."}{" "}
            The restaurant will only receive it after payment.
          </div>
        ) : (
          live && (
            <p className="mt-1 text-sm text-stone-500">
              Estimated delivery in about {order.eta_minutes} minutes. This page updates automatically.
            </p>
          )
        )}

        {cancelled ? (
          <p className="mt-4 rounded-xl bg-stone-100 px-4 py-3 text-sm text-stone-600">
            This order was cancelled.
            {!order.paid
              ? " You have not been charged."
              : order.payment_method === "wallet"
                ? " The money is back in your wallet."
                : " Your payment will be refunded."}
          </p>
        ) : (
          <ol className="mt-6 grid grid-cols-5 gap-2">
            {STEP_NAME.map((name, i) => (
              <li key={name}>
                <div className={`h-1.5 rounded-full ${i <= step ? "bg-orange-600" : "bg-stone-200"}`} />
                <p
                  className={`mt-2 text-xs ${i <= step ? "font-medium text-stone-900" : "text-stone-400"}`}
                >
                  {name}
                </p>
              </li>
            ))}
          </ol>
        )}

        {order.status === "pending" && cancellable && (
          <div className="mt-6 flex flex-wrap gap-2">
            {unpaid && (
              <form action={payNow}>
                <input type="hidden" name="orderId" value={order.id} />
                <button className="btn">Pay {money(order.total)} now</button>
              </form>
            )}
            {cancellable && (
              <form action={cancelOrder}>
                <input type="hidden" name="orderId" value={order.id} />
                <button className="btn-ghost">Cancel order</button>
              </form>
            )}
          </div>
        )}
      </section>

      <section className="card p-6">
        <h2 className="font-semibold">Items</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {items.map((item) => (
            <li key={item.id} className="flex justify-between gap-4">
              <span>
                <span className="text-stone-500">{item.qty} ×</span> {item.name}
              </span>
              <span className="tabular-nums">{money(item.price * item.qty)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-1 border-t border-stone-100 pt-3 text-sm">
          <div className="flex justify-between text-stone-600">
            <dt>Subtotal</dt>
            <dd>{money(order.subtotal)}</dd>
          </div>
          <div className="flex justify-between text-stone-600">
            <dt>Delivery</dt>
            <dd>{money(order.delivery_fee)}</dd>
          </div>
          <div className="flex justify-between pt-1 font-semibold">
            <dt>Total · {paymentLabel(order)}</dt>
            <dd>{money(order.total)}</dd>
          </div>
        </dl>
      </section>

      <section className="card p-6 text-sm">
        <h2 className="font-semibold">Delivering to</h2>
        <p className="mt-2 text-stone-700">{order.address}</p>
        <p className="text-stone-500">{order.phone}</p>
        {order.notes && <p className="mt-2 text-stone-500">Note: {order.notes}</p>}
      </section>
    </div>
  );
}

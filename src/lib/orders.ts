import "server-only";
import { change, transaction, type Order } from "./db";
import { awaitingPayment, ORDER_STEPS } from "./format";
import { addWalletEntry } from "./wallet";

/** Cancels an order that is still pending and returns wallet money to the customer. */
export function cancelPending(order: Order) {
  transaction(() => {
    const cancelled = change(
      "UPDATE orders SET status = 'cancelled' WHERE id = ? AND status = 'pending'",
      order.id,
    );
    if (cancelled && order.payment_method === "wallet" && order.paid) {
      addWalletEntry(order.user_id, order.total, "refund", `Refund for order #${order.id}`);
    }
  });
}

/** Moves an order to its next stage, or cancels it while it is still pending. */
export function moveOrder(order: Order, intent: string) {
  if (awaitingPayment(order)) return; // not the restaurant's to act on until paid
  const step = ORDER_STEPS.indexOf(order.status as (typeof ORDER_STEPS)[number]);
  if (intent === "reject") {
    cancelPending(order);
  } else if (step >= 0 && step < ORDER_STEPS.length - 1) {
    change("UPDATE orders SET status = ? WHERE id = ?", ORDER_STEPS[step + 1], order.id);
  }
}

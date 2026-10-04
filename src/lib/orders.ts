import "server-only";
import { run, type Order } from "./db";
import { awaitingPayment, ORDER_STEPS } from "./format";

/** Moves an order to its next stage, or cancels it while it is still pending. */
export function moveOrder(order: Order, intent: string) {
  if (awaitingPayment(order)) return; // not the restaurant's to act on until paid
  const step = ORDER_STEPS.indexOf(order.status as (typeof ORDER_STEPS)[number]);
  if (intent === "reject") {
    if (order.status === "pending") {
      run("UPDATE orders SET status = 'cancelled' WHERE id = ?", order.id);
    }
  } else if (step >= 0 && step < ORDER_STEPS.length - 1) {
    run("UPDATE orders SET status = ? WHERE id = ?", ORDER_STEPS[step + 1], order.id);
  }
}

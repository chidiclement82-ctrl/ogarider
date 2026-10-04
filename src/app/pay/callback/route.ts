import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { confirmPayment, orderByReference } from "@/lib/paystack";

/** Paystack sends the customer back here after the payment page. */
export async function GET(request: NextRequest) {
  const reference = request.nextUrl.searchParams.get("reference") ?? "";
  let order = orderByReference(reference);
  try {
    order = await confirmPayment(reference);
  } catch (err) {
    // The order page shows "Awaiting payment" with a retry button; the webhook may still confirm it.
    console.error("Paystack verification failed", err);
  }
  redirect(order ? `/orders/${order.id}` : "/orders");
}

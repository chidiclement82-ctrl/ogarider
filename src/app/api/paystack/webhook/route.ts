import { createHmac, timingSafeEqual } from "node:crypto";
import { confirmPayment } from "@/lib/paystack";

/**
 * Paystack calls this when a payment succeeds, so orders are marked paid even if
 * the customer closes the browser before returning. Set the webhook URL in the
 * Paystack dashboard to <APP_URL>/api/paystack/webhook.
 */
export async function POST(request: Request) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return new Response("Not configured", { status: 503 });

  const body = await request.text();
  const expected = Buffer.from(createHmac("sha512", secret).update(body).digest("hex"));
  const given = Buffer.from(request.headers.get("x-paystack-signature") ?? "");
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) {
    return new Response("Bad signature", { status: 401 });
  }

  const event = JSON.parse(body) as { event: string; data?: { reference?: string } };
  if (event.event === "charge.success" && event.data?.reference) {
    await confirmPayment(event.data.reference);
  }
  return new Response("ok");
}

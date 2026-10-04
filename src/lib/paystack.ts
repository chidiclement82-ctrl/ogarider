import "server-only";
import { randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { get, run, type Order } from "./db";
import { CURRENCY } from "./format";

const API = "https://api.paystack.co";

function secretKey() {
  return process.env.PAYSTACK_SECRET_KEY ?? "";
}

/** Without a Paystack key, development falls back to a clearly-labelled simulator. */
export function simulatorEnabled() {
  return !secretKey() && process.env.NODE_ENV !== "production";
}

/** Whether checkout should offer "Pay online now". */
export function onlinePaymentAvailable() {
  return !!secretKey() || simulatorEnabled();
}

async function paystack<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method: body ? "POST" : "GET",
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const json = (await res.json()) as { status: boolean; message: string; data: T };
  if (!res.ok || !json.status) throw new Error(json.message || "Paystack request failed");
  return json.data;
}

async function baseUrl() {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  const h = await headers();
  return `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
}

/** Starts a payment for an unpaid online order and returns the page to send the customer to. */
export async function startPayment(order: Order, email: string) {
  // A fresh reference per attempt: Paystack rejects reused references.
  const reference = `og-${order.id}-${randomBytes(6).toString("hex")}`;
  run("UPDATE orders SET payment_ref = ? WHERE id = ?", reference, order.id);

  if (simulatorEnabled()) return `/pay/test?reference=${reference}`;
  if (!secretKey()) throw new Error("Online payment is not set up yet.");

  const data = await paystack<{ authorization_url: string }>("/transaction/initialize", {
    email,
    amount: order.total, // already in kobo
    currency: CURRENCY,
    reference,
    callback_url: `${await baseUrl()}/pay/callback`,
    metadata: { order_id: order.id },
  });
  return data.authorization_url;
}

export function orderByReference(reference: string) {
  return reference ? get<Order>("SELECT * FROM orders WHERE payment_ref = ?", reference) : undefined;
}

/**
 * Asks Paystack whether the payment behind a reference succeeded and, if the amount
 * matches the order, marks it paid. Safe to call more than once.
 */
export async function confirmPayment(reference: string) {
  const order = orderByReference(reference);
  if (!order || order.paid) return order;

  const data = await paystack<{ status: string; amount: number; currency: string }>(
    `/transaction/verify/${encodeURIComponent(reference)}`,
  );
  if (data.status === "success" && data.amount === order.total && data.currency === CURRENCY) {
    run("UPDATE orders SET paid = 1 WHERE id = ?", order.id);
    return { ...order, paid: 1 };
  }
  return order;
}

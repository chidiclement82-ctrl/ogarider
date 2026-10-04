export const APP_NAME = "Ogarider";

export const CURRENCY = "NGN";
export const LOCALE = "en-NG";

/** Prices are stored as integer kobo (1 naira = 100 kobo), the unit Paystack uses. */
export function money(kobo: number) {
  return new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency: CURRENCY,
    minimumFractionDigits: 0,
  }).format(kobo / 100);
}

/** Converts a naira amount typed into a form to kobo; NaN when it is not a number. */
export function toKobo(naira: FormDataEntryValue | null) {
  return Math.round(Number(naira) * 100);
}

export function timeAgo(iso: string) {
  const mins = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  return new Date(iso).toLocaleDateString(LOCALE, {
    month: "short",
    day: "numeric",
  });
}

export const ORDER_STEPS = [
  "pending",
  "accepted",
  "preparing",
  "out_for_delivery",
  "delivered",
] as const;

export type OrderStatus = (typeof ORDER_STEPS)[number] | "cancelled";
export type PaymentMethod = "online" | "cod" | "wallet";

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Waiting for restaurant",
  accepted: "Accepted",
  preparing: "Being prepared",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const STATUS_STYLE: Record<OrderStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  accepted: "bg-sky-100 text-sky-800",
  preparing: "bg-indigo-100 text-indigo-800",
  out_for_delivery: "bg-violet-100 text-violet-800",
  delivered: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-stone-200 text-stone-600",
};

type Payable = { status: OrderStatus; payment_method: PaymentMethod; paid: number };

/** An online order is only sent to the restaurant once it has been paid. */
export function awaitingPayment(order: Payable) {
  return order.payment_method === "online" && !order.paid && order.status === "pending";
}

export function orderLabel(order: Payable) {
  return awaitingPayment(order) ? "Awaiting payment" : STATUS_LABEL[order.status];
}

export function orderStyle(order: Payable) {
  return awaitingPayment(order) ? "bg-red-100 text-red-800" : STATUS_STYLE[order.status];
}

export function paymentLabel(order: Payable) {
  if (order.payment_method === "cod") return "Pay on delivery";
  if (order.payment_method === "wallet") {
    return order.status === "cancelled" ? "Refunded to wallet" : "Paid from wallet";
  }
  if (!order.paid) return "Online · not paid";
  return order.status === "cancelled" ? "Paid online · refund due" : "Paid online";
}

export function validEmail(email: string) {
  return /^\S+@\S+\.\S+$/.test(email);
}

/** Nigerian mobile numbers: 0803 123 4567 or +234 803 123 4567. */
export function validPhone(phone: string) {
  return /^(\+?234|0)[789][01]\d{8}$/.test(phone.replace(/[\s()-]/g, ""));
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSession, destroySession, getUser, requireOwner } from "@/lib/auth";
import { all, get, run, transaction, type MenuItem, type Order, type Restaurant } from "@/lib/db";
import { awaitingPayment, toKobo, validEmail, validPhone } from "@/lib/format";
import { moveOrder } from "@/lib/orders";
import { hashPassword, verifyPassword } from "@/lib/password";
import {
  onlinePaymentAvailable,
  orderByReference,
  simulatorEnabled,
  startPayment,
} from "@/lib/paystack";
import { DEMO_ADMIN_EMAIL, DEMO_CUSTOMER_EMAIL, DEMO_RESTAURANT_EMAIL } from "@/lib/seed";
import { setupAllowed } from "@/lib/setup";

export type FormState = {
  error?: string;
  ok?: string;
  redirectTo?: string;
  /** What the person typed, sent back so a failed form keeps its fields (never passwords). */
  values?: Record<string, string>;
};

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

/** Only same-site paths are accepted as a post-login destination. */
function safeNext(next: string) {
  return next.startsWith("/") && !next.startsWith("//") ? next : "";
}

function homeFor(role: string, next = "") {
  if (safeNext(next)) return next;
  return role === "admin" ? "/admin" : role === "restaurant" ? "/dashboard" : "/";
}

// ---------- Accounts ----------

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = text(formData, "email").toLowerCase();
  const password = String(formData.get("password") ?? "");
  const user = get<{ id: number; role: string; password_hash: string }>(
    "SELECT id, role, password_hash FROM users WHERE email = ?",
    email,
  );
  if (!user || !verifyPassword(password, user.password_hash)) {
    return { error: "Wrong email or password.", values: { email } };
  }
  await createSession(user.id);
  redirect(homeFor(user.role, text(formData, "next")));
}

/** Customers sign themselves up; restaurant and admin accounts are created by an admin. */
export async function signup(_prev: FormState, formData: FormData): Promise<FormState> {
  const name = text(formData, "name");
  const email = text(formData, "email").toLowerCase();
  const password = String(formData.get("password") ?? "");

  const values = { name, email };
  if (!name || !validEmail(email)) return { error: "Enter your name and a valid email.", values };
  if (password.length < 8) return { error: "Password must be at least 8 characters.", values };
  if (get("SELECT 1 FROM users WHERE email = ?", email)) {
    return { error: "An account with this email already exists.", values };
  }

  const userId = run(
    "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'customer')",
    name,
    email,
    hashPassword(password),
  );
  await createSession(userId);
  redirect(homeFor("customer", text(formData, "next")));
}

/** First-run setup: creates the owner's admin account. See setupAllowed for when it is open. */
export async function createAdmin(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!setupAllowed()) return { error: "An admin account already exists. Please sign in." };
  const name = text(formData, "name");
  const email = text(formData, "email").toLowerCase();
  const password = String(formData.get("password") ?? "");

  const values = { name, email };
  if (!name || !validEmail(email)) return { error: "Enter your name and a valid email.", values };
  if (password.length < 10) return { error: "Password must be at least 10 characters.", values };
  if (get("SELECT 1 FROM users WHERE email = ?", email)) {
    return { error: "An account with this email already exists.", values };
  }

  const userId = run(
    "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'admin')",
    name,
    email,
    hashPassword(password),
  );
  await createSession(userId);
  redirect("/admin");
}

/** One-click sign-in for the seeded demo accounts; disabled in production. */
export async function demoLogin(formData: FormData) {
  if (process.env.NODE_ENV === "production") return;
  const email =
    {
      restaurant: DEMO_RESTAURANT_EMAIL,
      admin: DEMO_ADMIN_EMAIL,
    }[text(formData, "role")] ?? DEMO_CUSTOMER_EMAIL;
  const user = get<{ id: number; role: string }>("SELECT id, role FROM users WHERE email = ?", email);
  if (!user) return;
  await createSession(user.id);
  redirect(homeFor(user.role, text(formData, "next")));
}

export async function logout() {
  await destroySession();
  redirect("/");
}

// ---------- Customer orders ----------

export async function placeOrder(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getUser();
  if (!user) return { error: "Please sign in to place your order." };

  const address = text(formData, "address");
  const phone = text(formData, "phone");
  const notes = text(formData, "notes").slice(0, 500);
  const paymentMethod = text(formData, "paymentMethod") === "cod" ? "cod" : "online";
  if (paymentMethod === "online" && !onlinePaymentAvailable()) {
    return { error: "Online payment is not available right now. Choose pay on delivery." };
  }
  if (address.length < 5) return { error: "Enter a delivery address." };
  if (!validPhone(phone)) {
    return { error: "Enter a valid Nigerian phone number, e.g. 0803 123 4567." };
  }

  let lines: { id: number; qty: number }[];
  try {
    lines = JSON.parse(text(formData, "items"));
  } catch {
    return { error: "Your cart could not be read. Please try again." };
  }
  if (!Array.isArray(lines) || lines.length === 0) return { error: "Your cart is empty." };

  const restaurant = get<Restaurant>(
    "SELECT * FROM restaurants WHERE id = ? AND archived = 0",
    Number(formData.get("restaurantId")),
  );
  if (!restaurant) return { error: "This restaurant is no longer available." };
  if (!restaurant.is_open) return { error: `${restaurant.name} is closed right now.` };

  // Prices come from the database, never from the browser.
  const menu = new Map(
    all<MenuItem>("SELECT * FROM menu_items WHERE restaurant_id = ?", restaurant.id).map((m) => [
      m.id,
      m,
    ]),
  );
  const items: { item: MenuItem; qty: number }[] = [];
  for (const line of lines) {
    const item = menu.get(Number(line.id));
    const qty = Math.floor(Number(line.qty));
    if (!item || !(qty >= 1 && qty <= 50)) {
      return { error: "Something in your cart is no longer on the menu." };
    }
    if (!item.available) return { error: `${item.name} is currently unavailable.` };
    items.push({ item, qty });
  }

  const subtotal = items.reduce((sum, { item, qty }) => sum + item.price * qty, 0);
  const orderId = transaction(() => {
    const id = run(
      `INSERT INTO orders
         (user_id, restaurant_id, subtotal, delivery_fee, total, address, phone, notes,
          payment_method, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      user.id,
      restaurant.id,
      subtotal,
      restaurant.delivery_fee,
      subtotal + restaurant.delivery_fee,
      address,
      phone,
      notes,
      paymentMethod,
      new Date().toISOString(),
    );
    for (const { item, qty } of items) {
      run(
        "INSERT INTO order_items (order_id, menu_item_id, name, price, qty) VALUES (?, ?, ?, ?, ?)",
        id,
        item.id,
        item.name,
        item.price,
        qty,
      );
    }
    return id;
  });

  revalidatePath("/orders");
  if (paymentMethod === "online") {
    try {
      const order = get<Order>("SELECT * FROM orders WHERE id = ?", orderId)!;
      return { redirectTo: await startPayment(order, user.email) };
    } catch (err) {
      // The order is saved; its page offers "Pay now" to try again.
      console.error("Could not start payment", err);
      return { redirectTo: `/orders/${orderId}?pay=failed` };
    }
  }
  return { redirectTo: `/orders/${orderId}` };
}

/** "Pay now" on an order whose online payment was not completed. */
export async function payNow(formData: FormData) {
  const user = await getUser();
  const id = Number(formData.get("orderId"));
  const order = user && get<Order>("SELECT * FROM orders WHERE id = ? AND user_id = ?", id, user.id);
  if (!user || !order || !awaitingPayment(order)) redirect("/orders");

  let url = `/orders/${id}?pay=failed`;
  try {
    url = await startPayment(order, user.email);
  } catch (err) {
    console.error("Could not start payment", err);
  }
  redirect(url);
}

/** Development-only stand-in for Paystack, used when no key is configured. */
export async function simulatePayment(formData: FormData) {
  const user = await getUser();
  const order = orderByReference(text(formData, "reference"));
  if (!simulatorEnabled() || !user || !order || order.user_id !== user.id) redirect("/orders");

  const success = text(formData, "result") === "success";
  if (success) run("UPDATE orders SET paid = 1 WHERE id = ?", order.id);
  redirect(`/orders/${order.id}${success ? "" : "?pay=failed"}`);
}

/** Customers can cancel until the order is paid for or accepted; after that the restaurant decides. */
export async function cancelOrder(formData: FormData) {
  const user = await getUser();
  if (!user) return;
  const id = Number(formData.get("orderId"));
  run(
    `UPDATE orders SET status = 'cancelled'
      WHERE id = ? AND user_id = ? AND status = 'pending' AND paid = 0`,
    id,
    user.id,
  );
  revalidatePath(`/orders/${id}`);
}

// ---------- Restaurant dashboard ----------

export async function advanceOrder(formData: FormData) {
  const { restaurant } = await requireOwner();
  const order = get<Order>(
    "SELECT * FROM orders WHERE id = ? AND restaurant_id = ?",
    Number(formData.get("orderId")),
    restaurant.id,
  );
  if (order) moveOrder(order, text(formData, "intent"));
  revalidatePath("/dashboard");
}

export async function toggleOpen() {
  const { restaurant } = await requireOwner();
  run("UPDATE restaurants SET is_open = 1 - is_open WHERE id = ?", restaurant.id);
  revalidatePath("/dashboard");
}

export async function addMenuItem(_prev: FormState, formData: FormData): Promise<FormState> {
  const { restaurant } = await requireOwner();
  const name = text(formData, "name");
  const category = text(formData, "category");
  const price = toKobo(formData.get("price"));
  if (!name || !category) return { error: "Enter a name and a category." };
  if (!(price > 0)) return { error: "Enter a price greater than zero." };
  run(
    `INSERT INTO menu_items (restaurant_id, category, name, description, price)
     VALUES (?, ?, ?, ?, ?)`,
    restaurant.id,
    category,
    name,
    text(formData, "description"),
    price,
  );
  revalidatePath("/dashboard/menu");
  return {};
}

export async function updateMenuItem(formData: FormData) {
  const { restaurant } = await requireOwner();
  const id = Number(formData.get("itemId"));
  if (text(formData, "intent") === "toggle") {
    run(
      "UPDATE menu_items SET available = 1 - available WHERE id = ? AND restaurant_id = ?",
      id,
      restaurant.id,
    );
  } else {
    const price = toKobo(formData.get("price"));
    if (price > 0) {
      run(
        "UPDATE menu_items SET price = ? WHERE id = ? AND restaurant_id = ?",
        price,
        id,
        restaurant.id,
      );
    }
  }
  revalidatePath("/dashboard/menu");
}

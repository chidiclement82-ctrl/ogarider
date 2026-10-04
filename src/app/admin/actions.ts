"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { FormState } from "@/app/actions";
import { requireAdmin } from "@/lib/auth";
import { change, get, run, transaction, type MenuItem, type Order, type Restaurant } from "@/lib/db";
import { toKobo, validEmail } from "@/lib/format";
import { moveOrder } from "@/lib/orders";
import { hashPassword } from "@/lib/password";
import { saveImage } from "@/lib/uploads";
import { addWalletEntry, saveBankDetails, type Topup } from "@/lib/wallet";

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function message(err: unknown) {
  return err instanceof Error ? err.message : "Something went wrong.";
}

// ---------- Restaurants ----------

export async function saveRestaurant(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const id = Number(formData.get("restaurantId")) || 0;
  const name = text(formData, "name");
  const cuisine = text(formData, "cuisine");
  const description = text(formData, "description");
  const deliveryFee = toKobo(formData.get("deliveryFee"));
  const eta = Math.round(Number(formData.get("eta")));

  if (!name || !cuisine) return { error: "Enter the restaurant's name and cuisine." };
  if (!(deliveryFee >= 0)) return { error: "Enter a delivery fee of zero or more." };
  if (!(eta >= 5 && eta <= 180)) return { error: "Delivery time must be between 5 and 180 minutes." };

  let image: string;
  try {
    image = await saveImage(formData.get("image"));
  } catch (err) {
    return { error: message(err) };
  }

  if (!id) {
    const newId = run(
      `INSERT INTO restaurants (name, cuisine, description, delivery_fee, eta_minutes, image)
       VALUES (?, ?, ?, ?, ?, ?)`,
      name,
      cuisine,
      description,
      deliveryFee,
      eta,
      image,
    );
    revalidatePath("/");
    redirect(`/admin/restaurants/${newId}`);
  }

  // A new picture replaces the old one; no file chosen keeps it.
  run(
    `UPDATE restaurants
        SET name = ?, cuisine = ?, description = ?, delivery_fee = ?, eta_minutes = ?,
            image = CASE WHEN ? = '' THEN image ELSE ? END
      WHERE id = ?`,
    name,
    cuisine,
    description,
    deliveryFee,
    eta,
    image,
    image,
    id,
  );
  revalidatePath("/", "layout");
  return { ok: "Saved." };
}

export async function toggleRestaurantOpen(formData: FormData) {
  await requireAdmin();
  run("UPDATE restaurants SET is_open = 1 - is_open WHERE id = ?", Number(formData.get("restaurantId")));
  revalidatePath("/", "layout");
}

/** Removes a restaurant from the app. Its past orders are kept for the records. */
export async function removeRestaurant(formData: FormData) {
  await requireAdmin();
  run("UPDATE restaurants SET archived = 1 WHERE id = ?", Number(formData.get("restaurantId")));
  revalidatePath("/", "layout");
  redirect("/admin");
}

/** Creates or updates the login a restaurant uses to see and fulfil its own orders. */
export async function saveRestaurantLogin(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const restaurant = get<Restaurant>(
    "SELECT * FROM restaurants WHERE id = ?",
    Number(formData.get("restaurantId")),
  );
  if (!restaurant) return { error: "Restaurant not found." };

  const email = text(formData, "email").toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!validEmail(email)) return { error: "Enter a valid email." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };

  const taken = get<{ id: number }>("SELECT id FROM users WHERE email = ?", email);
  if (taken && taken.id !== restaurant.owner_id) {
    return { error: "Another account already uses this email." };
  }

  if (restaurant.owner_id) {
    run(
      "UPDATE users SET email = ?, password_hash = ? WHERE id = ?",
      email,
      hashPassword(password),
      restaurant.owner_id,
    );
    // Sign the restaurant out everywhere so the old password stops working at once.
    run("DELETE FROM sessions WHERE user_id = ?", restaurant.owner_id);
  } else {
    const ownerId = run(
      "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'restaurant')",
      `${restaurant.name} Owner`,
      email,
      hashPassword(password),
    );
    run("UPDATE restaurants SET owner_id = ? WHERE id = ?", ownerId, restaurant.id);
  }
  revalidatePath(`/admin/restaurants/${restaurant.id}`);
  return { ok: "Login saved." };
}

// ---------- Menu ----------

export async function saveMenuItem(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const restaurantId = Number(formData.get("restaurantId"));
  const itemId = Number(formData.get("itemId")) || 0;
  const name = text(formData, "name");
  const category = text(formData, "category");
  const description = text(formData, "description");
  const price = toKobo(formData.get("price"));
  const available = formData.get("available") ? 1 : 0;

  if (!name || !category) return { error: "Enter a name and a category." };
  if (!(price > 0)) return { error: "Enter a price greater than zero." };

  let image: string;
  try {
    image = await saveImage(formData.get("image"));
  } catch (err) {
    return { error: message(err) };
  }

  if (itemId) {
    run(
      `UPDATE menu_items
          SET name = ?, category = ?, description = ?, price = ?, available = ?,
              image = CASE WHEN ? = '' THEN image ELSE ? END
        WHERE id = ? AND restaurant_id = ?`,
      name,
      category,
      description,
      price,
      available,
      image,
      image,
      itemId,
      restaurantId,
    );
  } else {
    if (!get("SELECT 1 FROM restaurants WHERE id = ?", restaurantId)) {
      return { error: "Restaurant not found." };
    }
    run(
      `INSERT INTO menu_items (restaurant_id, category, name, description, price, image)
       VALUES (?, ?, ?, ?, ?, ?)`,
      restaurantId,
      category,
      name,
      description,
      price,
      image,
    );
  }
  revalidatePath("/", "layout");
  return { ok: itemId ? "Saved." : "Added." };
}

export async function deleteMenuItem(formData: FormData) {
  await requireAdmin();
  const item = get<MenuItem>("SELECT * FROM menu_items WHERE id = ?", Number(formData.get("itemId")));
  if (!item) return;
  run("DELETE FROM menu_items WHERE id = ?", item.id);
  revalidatePath("/", "layout");
}

// ---------- Orders ----------

export async function adminAdvanceOrder(formData: FormData) {
  await requireAdmin();
  const order = get<Order>("SELECT * FROM orders WHERE id = ?", Number(formData.get("orderId")));
  if (order) moveOrder(order, text(formData, "intent"));
  revalidatePath("/admin/orders");
}

// ---------- Wallet funding ----------

export async function saveBank(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const bankName = text(formData, "bankName");
  const accountNumber = text(formData, "accountNumber").replace(/\s/g, "");
  const accountName = text(formData, "accountName");
  const values = { bankName, accountNumber, accountName };
  if (!bankName || !accountName) return { error: "Enter the bank name and the account name.", values };
  if (!/^\d{10}$/.test(accountNumber)) {
    return { error: "A Nigerian account number has exactly 10 digits.", values };
  }
  saveBankDetails(values);
  revalidatePath("/", "layout");
  return { ok: "Saved. Customers now see this account on their wallet page.", values };
}

/** Confirms or rejects a customer's reported transfer. Approving credits their wallet once. */
export async function decideTopup(formData: FormData) {
  await requireAdmin();
  const topup = get<Topup>("SELECT * FROM topups WHERE id = ?", Number(formData.get("topupId")));
  if (!topup) return;
  const approve = text(formData, "intent") === "approve";
  transaction(() => {
    const decided = change(
      "UPDATE topups SET status = ? WHERE id = ? AND status = 'pending'",
      approve ? "approved" : "rejected",
      topup.id,
    );
    if (decided && approve) addWalletEntry(topup.user_id, topup.amount, "topup", "Bank transfer");
  });
  revalidatePath("/", "layout");
}

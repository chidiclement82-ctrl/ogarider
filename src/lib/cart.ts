"use client";

import { useSyncExternalStore } from "react";

export type CartItem = { id: number; name: string; price: number; qty: number };

export type Cart = {
  restaurantId: number | null;
  restaurantName: string;
  deliveryFee: number;
  items: CartItem[];
};

const KEY = "cart-v1";
const EMPTY: Cart = { restaurantId: null, restaurantName: "", deliveryFee: 0, items: [] };

let current: Cart | null = null;
const listeners = new Set<() => void>();

function read(): Cart {
  if (!current) {
    try {
      const raw = localStorage.getItem(KEY);
      current = raw ? (JSON.parse(raw) as Cart) : EMPTY;
    } catch {
      current = EMPTY;
    }
  }
  return current;
}

function write(next: Cart) {
  current = next.items.length ? next : EMPTY;
  try {
    localStorage.setItem(KEY, JSON.stringify(current));
  } catch {
    // Storage unavailable (private mode): the cart still works for this page view.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useCart() {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export function cartCount(cart: Cart) {
  return cart.items.reduce((sum, item) => sum + item.qty, 0);
}

export function cartSubtotal(cart: Cart) {
  return cart.items.reduce((sum, item) => sum + item.price * item.qty, 0);
}

/** A cart holds items from one restaurant; adding from another starts a new cart. */
export function addToCart(
  restaurant: { id: number; name: string; deliveryFee: number },
  item: Omit<CartItem, "qty">,
) {
  let cart = read();
  if (cart.restaurantId !== null && cart.restaurantId !== restaurant.id) {
    const ok = window.confirm(
      `Your cart has items from ${cart.restaurantName}. Start a new cart with ${restaurant.name}?`,
    );
    if (!ok) return;
    cart = EMPTY;
  }
  const existing = cart.items.find((i) => i.id === item.id);
  write({
    restaurantId: restaurant.id,
    restaurantName: restaurant.name,
    deliveryFee: restaurant.deliveryFee,
    items: existing
      ? cart.items.map((i) => (i.id === item.id ? { ...i, qty: i.qty + 1 } : i))
      : [...cart.items, { ...item, qty: 1 }],
  });
}

export function changeQty(itemId: number, delta: number) {
  const cart = read();
  write({
    ...cart,
    items: cart.items
      .map((i) => (i.id === itemId ? { ...i, qty: i.qty + delta } : i))
      .filter((i) => i.qty > 0),
  });
}

export function clearCart() {
  write(EMPTY);
}

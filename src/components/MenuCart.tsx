"use client";

import Link from "next/link";
import { addToCart, cartCount, cartSubtotal, useCart } from "@/lib/cart";
import { money } from "@/lib/format";
import { CartLines } from "./CartLines";

type RestaurantRef = { id: number; name: string; deliveryFee: number };

export function AddToCartButton({
  restaurant,
  item,
  disabled,
}: {
  restaurant: RestaurantRef;
  item: { id: number; name: string; price: number };
  disabled: boolean;
}) {
  const inCart = useCart().items.find((i) => i.id === item.id)?.qty ?? 0;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => addToCart(restaurant, item)}
      className="btn-ghost shrink-0"
    >
      {inCart > 0 ? `Add another · ${inCart}` : "Add"}
    </button>
  );
}

/** Sidebar cart on desktop, sticky bar on mobile. */
export function MenuCart({ restaurant }: { restaurant: RestaurantRef }) {
  const cart = useCart();
  const mine = cart.restaurantId === restaurant.id && cart.items.length > 0;
  const subtotal = cartSubtotal(cart);
  const { deliveryFee } = restaurant;

  return (
    <>
      <aside className="card sticky top-24 hidden h-fit p-5 lg:block">
        <h2 className="font-semibold">Your order</h2>
        {mine ? (
          <>
            <CartLines cart={cart} />
            <dl className="mt-2 space-y-1 border-t border-stone-100 pt-3 text-sm">
              <div className="flex justify-between text-stone-600">
                <dt>Subtotal</dt>
                <dd>{money(subtotal)}</dd>
              </div>
              <div className="flex justify-between text-stone-600">
                <dt>Delivery</dt>
                <dd>{money(deliveryFee)}</dd>
              </div>
              <div className="flex justify-between pt-1 font-semibold">
                <dt>Total</dt>
                <dd>{money(subtotal + deliveryFee)}</dd>
              </div>
            </dl>
            <Link href="/checkout" className="btn mt-4 w-full">
              Go to checkout
            </Link>
          </>
        ) : (
          <p className="mt-2 text-sm text-stone-500">
            Add dishes from the menu and they will show up here.
          </p>
        )}
      </aside>

      {mine && (
        <Link
          href="/checkout"
          className="btn fixed inset-x-4 bottom-20 z-10 justify-between py-3.5 shadow-lg sm:bottom-4 lg:hidden"
        >
          <span>View cart · {cartCount(cart)}</span>
          <span>{money(subtotal)}</span>
        </Link>
      )}
    </>
  );
}

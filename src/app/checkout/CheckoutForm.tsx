"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { placeOrder, type FormState } from "@/app/actions";
import { CartLines } from "@/components/CartLines";
import { cartSubtotal, clearCart, useCart } from "@/lib/cart";
import { money } from "@/lib/format";

export function CheckoutForm({
  signedIn,
  onlineAvailable,
}: {
  signedIn: boolean;
  onlineAvailable: boolean;
}) {
  const cart = useCart();
  const [state, action, pending] = useActionState<FormState, FormData>(placeOrder, {});

  // Either the order page or, for online payment, the Paystack payment page.
  useEffect(() => {
    if (state.redirectTo) {
      clearCart();
      window.location.assign(state.redirectTo);
    }
  }, [state.redirectTo]);

  if (state.redirectTo) {
    return <p className="card p-10 text-center text-stone-500">Order placed. One moment…</p>;
  }

  if (cart.items.length === 0) {
    return (
      <div className="card p-10 text-center">
        <p className="text-stone-500">Your cart is empty.</p>
        <Link href="/" className="btn mt-4">
          Browse restaurants
        </Link>
      </div>
    );
  }

  const subtotal = cartSubtotal(cart);

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_340px]">
      <form action={action} className="card space-y-4 p-5">
        <h2 className="font-semibold">Delivery details</h2>
        <input type="hidden" name="restaurantId" value={cart.restaurantId ?? ""} />
        <input
          type="hidden"
          name="items"
          value={JSON.stringify(cart.items.map(({ id, qty }) => ({ id, qty })))}
        />
        <div>
          <label className="label" htmlFor="address">
            Delivery address
          </label>
          <input id="address" name="address" required className="input" placeholder="Street, building, floor" />
        </div>
        <div>
          <label className="label" htmlFor="phone">
            Phone number
          </label>
          <input id="phone" name="phone" type="tel" required className="input" placeholder="0803 123 4567" />
        </div>
        <div>
          <label className="label" htmlFor="notes">
            Notes for the restaurant <span className="font-normal text-stone-400">(optional)</span>
          </label>
          <textarea id="notes" name="notes" rows={2} className="input" placeholder="Allergies, no onions, gate code…" />
        </div>
        <fieldset>
          <legend className="label">Payment</legend>
          <div className="space-y-2">
            {onlineAvailable && (
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-stone-300 p-3.5 has-checked:border-orange-500 has-checked:bg-orange-50">
                <input type="radio" name="paymentMethod" value="online" defaultChecked className="mt-1 accent-orange-600" />
                <span>
                  <span className="block text-sm font-medium">Pay online now</span>
                  <span className="block text-xs text-stone-500">
                    Card, bank transfer or USSD, secured by Paystack.
                  </span>
                </span>
              </label>
            )}
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-stone-300 p-3.5 has-checked:border-orange-500 has-checked:bg-orange-50">
              <input
                type="radio"
                name="paymentMethod"
                value="cod"
                defaultChecked={!onlineAvailable}
                className="mt-1 accent-orange-600"
              />
              <span>
                <span className="block text-sm font-medium">Pay on delivery</span>
                <span className="block text-xs text-stone-500">Cash or transfer to the rider.</span>
              </span>
            </label>
          </div>
        </fieldset>

        {state.error && (
          <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {state.error}
          </p>
        )}

        {signedIn ? (
          <button className="btn w-full py-3" disabled={pending}>
            {pending ? "Placing order…" : `Place order · ${money(subtotal + cart.deliveryFee)}`}
          </button>
        ) : (
          <Link href="/login?next=/checkout" className="btn w-full py-3">
            Sign in to place order
          </Link>
        )}
      </form>

      <aside className="card h-fit p-5">
        <h2 className="font-semibold">{cart.restaurantName}</h2>
        <CartLines cart={cart} />
        <dl className="mt-2 space-y-1 border-t border-stone-100 pt-3 text-sm">
          <div className="flex justify-between text-stone-600">
            <dt>Subtotal</dt>
            <dd>{money(subtotal)}</dd>
          </div>
          <div className="flex justify-between text-stone-600">
            <dt>Delivery</dt>
            <dd>{money(cart.deliveryFee)}</dd>
          </div>
          <div className="flex justify-between pt-1 font-semibold">
            <dt>Total</dt>
            <dd>{money(subtotal + cart.deliveryFee)}</dd>
          </div>
        </dl>
        <Link
          href={`/restaurants/${cart.restaurantId}`}
          className="mt-4 block text-sm font-medium text-orange-700 hover:underline"
        >
          + Add more items
        </Link>
      </aside>
    </div>
  );
}

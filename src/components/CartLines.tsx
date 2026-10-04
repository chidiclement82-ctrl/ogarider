"use client";

import { changeQty, type Cart } from "@/lib/cart";
import { money } from "@/lib/format";

export function CartLines({ cart }: { cart: Cart }) {
  return (
    <ul className="divide-y divide-stone-100">
      {cart.items.map((item) => (
        <li key={item.id} className="flex items-center gap-3 py-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{item.name}</p>
            <p className="text-xs text-stone-500">{money(item.price * item.qty)}</p>
          </div>
          <div className="flex items-center gap-1 rounded-full border border-stone-200 p-0.5">
            <button
              type="button"
              onClick={() => changeQty(item.id, -1)}
              aria-label={`Remove one ${item.name}`}
              className="grid size-7 place-items-center rounded-full hover:bg-stone-100"
            >
              −
            </button>
            <span className="w-5 text-center text-sm tabular-nums">{item.qty}</span>
            <button
              type="button"
              onClick={() => changeQty(item.id, 1)}
              aria-label={`Add one ${item.name}`}
              className="grid size-7 place-items-center rounded-full hover:bg-stone-100"
            >
              +
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}

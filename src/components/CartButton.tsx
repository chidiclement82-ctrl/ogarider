"use client";

import Link from "next/link";
import { cartCount, useCart } from "@/lib/cart";

export function CartButton() {
  const count = cartCount(useCart());
  return (
    <Link
      href="/checkout"
      className="relative rounded-full px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100"
    >
      Cart
      {count > 0 && (
        <span className="ml-1.5 inline-grid min-w-5 place-items-center rounded-full bg-orange-600 px-1.5 text-xs font-semibold text-white">
          {count}
        </span>
      )}
    </Link>
  );
}

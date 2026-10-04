"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cartCount, useCart } from "@/lib/cart";

type Role = "customer" | "restaurant" | "admin" | null;

/** Phone-only tab bar; larger screens use the links in the header instead. */
export function BottomNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const count = cartCount(useCart());

  const tabs = [
    { href: "/", label: "Home", icon: "🏠", active: pathname === "/" || pathname.startsWith("/restaurants") },
    ...(role ? [{ href: "/orders", label: "Orders", icon: "🧾", active: pathname.startsWith("/orders") }] : []),
    ...(role ? [{ href: "/wallet", label: "Wallet", icon: "👛", active: pathname.startsWith("/wallet") }] : []),
    { href: "/checkout", label: "Cart", icon: "🛒", active: pathname.startsWith("/checkout"), badge: count },
    ...(role === "admin"
      ? [{ href: "/admin", label: "Admin", icon: "⚙️", active: pathname.startsWith("/admin") }]
      : []),
    ...(role === "restaurant"
      ? [{ href: "/dashboard", label: "Kitchen", icon: "👨‍🍳", active: pathname.startsWith("/dashboard") }]
      : []),
    ...(role ? [] : [{ href: "/login", label: "Sign in", icon: "👤", active: pathname.startsWith("/login") }]),
  ];

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-stone-200 bg-white pb-[env(safe-area-inset-bottom)] sm:hidden"
    >
      <ul className="flex">
        {tabs.map((tab) => (
          <li key={tab.href} className="flex-1">
            <Link
              href={tab.href}
              aria-current={tab.active ? "page" : undefined}
              className={`relative flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${
                tab.active ? "text-orange-700" : "text-stone-500"
              }`}
            >
              <span className={`text-xl leading-none ${tab.active ? "" : "grayscale"}`} aria-hidden>
                {tab.icon}
              </span>
              {tab.label}
              {!!tab.badge && (
                <span className="absolute right-1/2 top-1 -mr-5 grid min-w-4 place-items-center rounded-full bg-orange-600 px-1 text-[10px] font-semibold text-white">
                  {tab.badge}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

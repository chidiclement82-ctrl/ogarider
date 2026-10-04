"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Admin section tabs: a 2×2 grid of buttons on phones, a single row on larger screens. */
export function AdminNav({ pendingFunding }: { pendingFunding: number }) {
  const pathname = usePathname();
  const tabs = [
    {
      href: "/admin",
      label: "Restaurants",
      active: pathname === "/admin" || pathname.startsWith("/admin/restaurants"),
    },
    { href: "/admin/orders", label: "Orders", active: pathname.startsWith("/admin/orders") },
    {
      href: "/admin/funding",
      label: "Wallet funding",
      active: pathname.startsWith("/admin/funding"),
      badge: pendingFunding,
    },
    { href: "/admin/settings", label: "Bank account", active: pathname.startsWith("/admin/settings") },
  ];

  return (
    <nav
      aria-label="Admin"
      className="grid grid-cols-2 gap-2 border-b border-stone-200 pb-4 sm:flex sm:flex-wrap sm:items-center sm:gap-1"
    >
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          aria-current={tab.active ? "page" : undefined}
          className={`flex items-center justify-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium sm:border-transparent sm:py-1.5 ${
            tab.active
              ? "border-stone-900 bg-stone-900 text-white"
              : "border-stone-300 bg-white text-stone-700 hover:bg-stone-100 sm:bg-transparent sm:hover:bg-stone-200"
          }`}
        >
          {tab.label}
          {!!tab.badge && (
            <span className="inline-grid min-w-5 place-items-center rounded-full bg-orange-600 px-1.5 text-xs font-semibold text-white">
              {tab.badge}
            </span>
          )}
        </Link>
      ))}
      <Link href="/admin/restaurants/new" className="btn col-span-2 sm:ml-auto">
        + Add restaurant
      </Link>
    </nav>
  );
}

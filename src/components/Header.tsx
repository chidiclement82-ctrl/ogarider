import Link from "next/link";
import { logout } from "@/app/actions";
import { getUser } from "@/lib/auth";
import { APP_NAME, money } from "@/lib/format";
import { walletBalance } from "@/lib/wallet";
import { BottomNav } from "./BottomNav";
import { CartButton } from "./CartButton";

export async function Header() {
  const user = await getUser();
  const navLink = "rounded-full px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100";

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-1 px-4 sm:h-16">
          <Link href="/" className="mr-auto flex items-center gap-2 text-lg font-bold tracking-tight">
            <span className="grid size-8 place-items-center rounded-xl bg-orange-600 text-base">🛵</span>
            {APP_NAME}
          </Link>

          {/* Phones get these links in the bottom tab bar instead. */}
          <nav className="hidden items-center gap-1 sm:flex" aria-label="Main">
            {user?.role === "admin" && (
              <Link href="/admin" className={navLink}>
                Admin
              </Link>
            )}
            {user?.role === "restaurant" && (
              <Link href="/dashboard" className={navLink}>
                Dashboard
              </Link>
            )}
            {user && (
              <Link href="/orders" className={navLink}>
                Orders
              </Link>
            )}
            {user && (
              <Link href="/wallet" className={`${navLink} whitespace-nowrap`}>
                Wallet <span className="text-stone-500">{money(walletBalance(user.id))}</span>
              </Link>
            )}
            <CartButton />
          </nav>

          {user ? (
            <form action={logout} className="flex items-center gap-2 pl-1">
              <span className="hidden text-sm text-stone-500 lg:inline">{user.name}</span>
              <button className="btn-ghost whitespace-nowrap">Sign out</button>
            </form>
          ) : (
            <Link href="/login" className="btn ml-1 whitespace-nowrap">
              Sign in
            </Link>
          )}
        </div>
      </header>
      <BottomNav role={user?.role ?? null} />
    </>
  );
}

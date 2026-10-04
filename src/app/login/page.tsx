import Link from "next/link";
import { demoLogin } from "@/app/actions";
import { LoginForm } from "@/components/AuthForm";
import { setupAllowed } from "@/lib/setup";

export const metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next = "" } = await searchParams;
  const showDemo = process.env.NODE_ENV !== "production";

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Sign in</h1>
      <div className="card p-6">
        <LoginForm next={next} />
      </div>
      <p className="mt-4 text-center text-sm text-stone-600">
        New here?{" "}
        <Link
          href={next ? `/signup?next=${encodeURIComponent(next)}` : "/signup"}
          className="font-medium text-orange-700 hover:underline"
        >
          Create an account
        </Link>
      </p>

      {setupAllowed() && (
        <p className="mt-2 text-center text-sm text-stone-600">
          Running this app?{" "}
          <Link href="/setup" className="font-medium text-orange-700 hover:underline">
            Create your admin account
          </Link>
        </p>
      )}

      {showDemo && (
        <form action={demoLogin} className="mt-8 rounded-2xl border border-dashed border-stone-300 p-4">
          <input type="hidden" name="next" value={next} />
          <p className="mb-3 text-center text-xs font-medium uppercase tracking-wide text-stone-500">
            Demo accounts
          </p>
          <div className="flex gap-2">
            <button name="role" value="customer" className="btn-ghost flex-1">
              Customer
            </button>
            <button name="role" value="restaurant" className="btn-ghost flex-1">
              Restaurant
            </button>
            <button name="role" value="admin" className="btn-ghost flex-1">
              Admin
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

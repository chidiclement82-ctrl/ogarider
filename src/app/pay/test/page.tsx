import { notFound } from "next/navigation";
import { simulatePayment } from "@/app/actions";
import { requireUser } from "@/lib/auth";
import { money } from "@/lib/format";
import { orderByReference, simulatorEnabled } from "@/lib/paystack";

export const metadata = { title: "Payment simulator" };

/** Stands in for the Paystack payment page in development when no key is configured. */
export default async function TestPaymentPage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string }>;
}) {
  if (!simulatorEnabled()) notFound();
  const { reference = "" } = await searchParams;
  const user = await requireUser("/orders");
  const order = orderByReference(reference);
  if (!order || order.user_id !== user.id) notFound();

  return (
    <div className="mx-auto max-w-sm">
      <div className="card p-6 text-center">
        <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
          Payment simulator · development only
        </p>
        <p className="mt-4 text-sm text-stone-500">Order #{order.id}</p>
        <p className="text-3xl font-bold">{money(order.total)}</p>
        <p className="mt-4 text-sm text-stone-600">
          No Paystack key is set, so no real payment happens. Add PAYSTACK_SECRET_KEY to .env.local
          to use the real Paystack page.
        </p>
        <form action={simulatePayment} className="mt-6 space-y-2">
          <input type="hidden" name="reference" value={reference} />
          <button name="result" value="success" className="btn w-full py-3">
            Simulate successful payment
          </button>
          <button name="result" value="failed" className="btn-ghost w-full">
            Simulate failed payment
          </button>
        </form>
      </div>
    </div>
  );
}

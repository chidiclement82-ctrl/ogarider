import { getUser } from "@/lib/auth";
import { onlinePaymentAvailable } from "@/lib/paystack";
import { CheckoutForm } from "./CheckoutForm";

export const metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const user = await getUser();
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Checkout</h1>
      <CheckoutForm signedIn={!!user} onlineAvailable={onlinePaymentAvailable()} />
    </div>
  );
}

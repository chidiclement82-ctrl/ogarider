import { requireAdmin } from "@/lib/auth";
import { bankDetails } from "@/lib/wallet";
import { BankForm } from "./BankForm";

export const metadata = { title: "Bank account" };

export default async function SettingsPage() {
  await requireAdmin();
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Bank account</h1>
        <p className="mt-1 text-sm text-stone-500">
          Customers transfer money to this account to fund their wallets. It is shown to every
          signed-in customer on their wallet page.
        </p>
      </div>
      <div className="card p-6">
        <BankForm bank={bankDetails()} />
      </div>
    </div>
  );
}

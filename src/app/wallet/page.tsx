import { requireUser } from "@/lib/auth";
import { all } from "@/lib/db";
import { money, timeAgo } from "@/lib/format";
import {
  bankDetails,
  transferCode,
  walletBalance,
  type Topup,
  type WalletEntry,
} from "@/lib/wallet";
import { TopupForm } from "./TopupForm";

export const metadata = { title: "Wallet" };

const TOPUP_STYLE: Record<Topup["status"], string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-stone-200 text-stone-600",
};
const TOPUP_LABEL: Record<Topup["status"], string> = {
  pending: "Waiting for confirmation",
  approved: "Confirmed",
  rejected: "Not received",
};

export default async function WalletPage() {
  const user = await requireUser("/wallet");
  const bank = bankDetails();
  const topups = all<Topup>(
    "SELECT * FROM topups WHERE user_id = ? ORDER BY id DESC LIMIT 20",
    user.id,
  );
  const entries = all<WalletEntry>(
    "SELECT * FROM wallet_transactions WHERE user_id = ? ORDER BY id DESC LIMIT 50",
    user.id,
  );

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <section className="rounded-3xl bg-stone-900 p-6 text-white">
        <p className="text-sm text-stone-300">Wallet balance</p>
        <p className="mt-1 text-4xl font-bold tabular-nums">{money(walletBalance(user.id))}</p>
        <p className="mt-2 text-sm text-stone-300">Use it to pay for any order at checkout.</p>
      </section>

      <section className="card p-6">
        <h1 className="text-lg font-semibold">Fund your wallet</h1>
        {bank ? (
          <>
            <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-stone-600">
              <li>Transfer the amount you want to this bank account.</li>
              <li>
                Put <span className="font-semibold text-stone-900">{transferCode(user.id)}</span> in the
                transfer&apos;s narration or remark.
              </li>
              <li>Fill in the form below so we know to look for it.</li>
            </ol>
            <dl className="mt-4 grid gap-3 rounded-2xl bg-orange-50 p-4 sm:grid-cols-3">
              <div>
                <dt className="text-xs text-stone-500">Bank</dt>
                <dd className="font-medium">{bank.bankName}</dd>
              </div>
              <div>
                <dt className="text-xs text-stone-500">Account number</dt>
                <dd className="font-mono text-lg font-semibold tracking-wider">{bank.accountNumber}</dd>
              </div>
              <div>
                <dt className="text-xs text-stone-500">Account name</dt>
                <dd className="font-medium">{bank.accountName}</dd>
              </div>
            </dl>
            <div className="mt-5">
              <TopupForm />
            </div>
          </>
        ) : (
          <p className="mt-2 text-sm text-stone-500">
            Funding by bank transfer is not available yet. Please check back soon.
          </p>
        )}
      </section>

      {topups.length > 0 && (
        <section className="card p-6">
          <h2 className="font-semibold">Your transfers</h2>
          <ul className="mt-3 divide-y divide-stone-100 text-sm">
            {topups.map((t) => (
              <li key={t.id} className="flex items-center gap-3 py-2.5">
                <span className="font-medium tabular-nums">{money(t.amount)}</span>
                <span className="mr-auto text-stone-500">{timeAgo(t.created_at)}</span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${TOPUP_STYLE[t.status]}`}>
                  {TOPUP_LABEL[t.status]}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card p-6">
        <h2 className="font-semibold">Wallet history</h2>
        {entries.length === 0 ? (
          <p className="mt-2 text-sm text-stone-500">Nothing here yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-stone-100 text-sm">
            {entries.map((e) => (
              <li key={e.id} className="flex items-center gap-3 py-2.5">
                <span className="mr-auto">
                  {e.note} <span className="text-stone-500">· {timeAgo(e.created_at)}</span>
                </span>
                <span
                  className={`font-medium tabular-nums ${e.amount > 0 ? "text-emerald-700" : "text-stone-900"}`}
                >
                  {e.amount > 0 ? "+" : "−"}
                  {money(Math.abs(e.amount))}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

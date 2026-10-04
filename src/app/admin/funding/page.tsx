import Link from "next/link";
import { AutoRefresh } from "@/components/AutoRefresh";
import { requireAdmin } from "@/lib/auth";
import { all } from "@/lib/db";
import { money, timeAgo } from "@/lib/format";
import { bankDetails, transferCode, type Topup } from "@/lib/wallet";
import { decideTopup } from "../actions";

export const metadata = { title: "Wallet funding" };

type Row = Topup & { customer_name: string; email: string };

export default async function FundingPage() {
  await requireAdmin();
  const rows = all<Row>(
    `SELECT t.*, u.name AS customer_name, u.email
       FROM topups t JOIN users u ON u.id = t.user_id
      ORDER BY t.status = 'pending' DESC, t.id DESC LIMIT 200`,
  );
  const pending = rows.filter((r) => r.status === "pending");
  const decided = rows.filter((r) => r.status !== "pending");

  return (
    <div className="space-y-6">
      <AutoRefresh seconds={15} />
      <div>
        <h1 className="text-xl font-bold tracking-tight">Wallet funding</h1>
        <p className="mt-1 text-sm text-stone-500">
          Customers report transfers here. Check your bank account, then confirm only the ones that
          really arrived: confirming adds the money to the customer&apos;s wallet.
        </p>
      </div>

      {!bankDetails() && (
        <p className="rounded-2xl bg-amber-50 px-5 py-4 text-sm text-amber-900">
          Customers cannot fund their wallets yet.{" "}
          <Link href="/admin/settings" className="font-medium underline">
            Add your bank account
          </Link>{" "}
          first.
        </p>
      )}

      <section>
        <h2 className="mb-3 font-semibold">Waiting for you · {pending.length}</h2>
        {pending.length === 0 ? (
          <p className="card p-8 text-center text-stone-500">No transfers waiting.</p>
        ) : (
          <ul className="space-y-3">
            {pending.map((t) => (
              <li key={t.id} className="card flex flex-wrap items-center gap-x-6 gap-y-3 p-4">
                <div className="min-w-56 flex-1">
                  <p className="text-xl font-bold tabular-nums">{money(t.amount)}</p>
                  <p className="text-sm text-stone-700">
                    Sent from: <span className="font-medium">{t.sender_name}</span> · Narration:{" "}
                    <span className="font-medium">{transferCode(t.user_id)}</span>
                  </p>
                  <p className="text-sm text-stone-500">
                    {t.customer_name} · {t.email} · {timeAgo(t.created_at)}
                  </p>
                </div>
                <form action={decideTopup} className="flex gap-2">
                  <input type="hidden" name="topupId" value={t.id} />
                  <button name="intent" value="reject" className="btn-ghost">
                    Not received
                  </button>
                  <button name="intent" value="approve" className="btn">
                    Money received
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      {decided.length > 0 && (
        <section>
          <h2 className="mb-3 font-semibold">History</h2>
          <ul className="card divide-y divide-stone-100 text-sm">
            {decided.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                <span className="w-24 font-medium tabular-nums">{money(t.amount)}</span>
                <span className="min-w-0 flex-1 truncate">
                  {t.customer_name} <span className="text-stone-500">· from {t.sender_name}</span>
                </span>
                <span className="text-stone-500">{timeAgo(t.created_at)}</span>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    t.status === "approved" ? "bg-emerald-100 text-emerald-800" : "bg-stone-200 text-stone-600"
                  }`}
                >
                  {t.status === "approved" ? "Confirmed" : "Not received"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

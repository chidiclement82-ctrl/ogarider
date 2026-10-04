import "server-only";
import { get, run } from "./db";

export type BankDetails = { bankName: string; accountNumber: string; accountName: string };

export type WalletEntry = {
  id: number;
  user_id: number;
  amount: number; // kobo; positive adds to the balance, negative spends from it
  kind: "topup" | "order" | "refund";
  note: string;
  created_at: string;
};

export type Topup = {
  id: number;
  user_id: number;
  amount: number;
  sender_name: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
};

/** The balance is always the sum of the entries, so it cannot drift from the history. */
export function walletBalance(userId: number) {
  return get<{ balance: number }>(
    "SELECT COALESCE(SUM(amount), 0) AS balance FROM wallet_transactions WHERE user_id = ?",
    userId,
  )!.balance;
}

export function addWalletEntry(userId: number, amount: number, kind: WalletEntry["kind"], note: string) {
  run(
    "INSERT INTO wallet_transactions (user_id, amount, kind, note, created_at) VALUES (?, ?, ?, ?, ?)",
    userId,
    amount,
    kind,
    note,
    new Date().toISOString(),
  );
}

function setting(key: string) {
  return get<{ value: string }>("SELECT value FROM settings WHERE key = ?", key)?.value ?? "";
}

/** The account customers transfer to, or null until the admin has entered it. */
export function bankDetails(): BankDetails | null {
  const accountNumber = setting("bank_account_number");
  if (!accountNumber) return null;
  return {
    bankName: setting("bank_name"),
    accountNumber,
    accountName: setting("bank_account_name"),
  };
}

export function saveBankDetails(details: BankDetails) {
  const upsert =
    "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value";
  run(upsert, "bank_name", details.bankName);
  run(upsert, "bank_account_number", details.accountNumber);
  run(upsert, "bank_account_name", details.accountName);
}

/** What a customer writes in the transfer's narration so the admin can match it to them. */
export function transferCode(userId: number) {
  return `OG-${userId}`;
}

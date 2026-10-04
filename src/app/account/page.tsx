import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { DeleteAccountForm } from "./DeleteAccountForm";

export const metadata = { title: "Your account" };

export default async function AccountPage() {
  const user = await requireUser("/account");
  return (
    <div className="mx-auto max-w-xl space-y-5">
      <h1 className="text-2xl font-bold tracking-tight">Your account</h1>

      <section className="card p-6">
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-stone-500">Name</dt>
            <dd className="font-medium">{user.name}</dd>
          </div>
          <div>
            <dt className="text-stone-500">Email</dt>
            <dd className="font-medium">{user.email}</dd>
          </div>
        </dl>
        <p className="mt-4 text-sm text-stone-500">
          See how we handle your information in our{" "}
          <Link href="/privacy" className="font-medium text-orange-700 underline">
            privacy policy
          </Link>
          .
        </p>
      </section>

      <section className="card border-red-200 p-6">
        <h2 className="font-semibold text-red-800">Delete account</h2>
        {user.role === "customer" ? (
          <>
            <p className="mb-4 mt-1 text-sm text-stone-600">
              This permanently removes your name, email, phone numbers and delivery addresses. It
              cannot be undone. Past order amounts are kept without your personal details.
            </p>
            <DeleteAccountForm />
          </>
        ) : (
          <p className="mt-1 text-sm text-stone-600">
            Restaurant and admin accounts are managed by the app&apos;s administrator.
          </p>
        )}
      </section>
    </div>
  );
}

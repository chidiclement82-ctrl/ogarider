import { redirect } from "next/navigation";
import { setupAllowed } from "@/lib/setup";
import { SetupForm } from "./SetupForm";

export const metadata = { title: "Create admin account" };

export default function SetupPage() {
  if (!setupAllowed()) redirect("/login");
  return (
    <div className="mx-auto max-w-sm">
      <h1 className="text-2xl font-bold tracking-tight">Create your admin account</h1>
      <p className="mb-6 mt-1 text-sm text-stone-500">
        This account manages restaurants, menus, prices and orders. This page closes once the
        account exists.
      </p>
      <div className="card p-6">
        <SetupForm />
      </div>
    </div>
  );
}

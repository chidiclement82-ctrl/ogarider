"use client";

import { useActionState } from "react";
import { deleteAccount, type FormState } from "@/app/actions";
import { FormMessage } from "@/components/AuthForm";

export function DeleteAccountForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(deleteAccount, {});
  return (
    <form action={action} className="space-y-3">
      <div>
        <label className="label" htmlFor="password">
          Enter your password to confirm
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="input"
        />
      </div>
      <FormMessage state={state} />
      <button
        className="rounded-full border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
        disabled={pending}
      >
        {pending ? "Deleting…" : "Delete my account permanently"}
      </button>
    </form>
  );
}

"use client";

import { useActionState } from "react";
import { requestTopup, type FormState } from "@/app/actions";
import { FormMessage } from "@/components/AuthForm";

export function TopupForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(requestTopup, {});
  // After a successful report the fields start empty again.
  const values = state.ok ? undefined : state.values;
  return (
    <form action={action} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="amount">
            Amount you sent (₦)
          </label>
          <input
            id="amount"
            name="amount"
            type="number"
            min="100"
            step="1"
            required
            defaultValue={values?.amount}
            className="input"
          />
        </div>
        <div>
          <label className="label" htmlFor="senderName">
            Name on the account you sent from
          </label>
          <input
            id="senderName"
            name="senderName"
            required
            defaultValue={values?.senderName}
            className="input"
          />
        </div>
      </div>
      <FormMessage state={state} />
      <button className="btn" disabled={pending}>
        {pending ? "Sending…" : "I have made the transfer"}
      </button>
    </form>
  );
}

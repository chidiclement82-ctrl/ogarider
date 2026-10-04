"use client";

import { useActionState } from "react";
import type { FormState } from "@/app/actions";
import { FormMessage } from "@/components/AuthForm";
import type { BankDetails } from "@/lib/wallet";
import { saveBank } from "../actions";

export function BankForm({ bank }: { bank: BankDetails | null }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveBank, {});
  const values = state.values ?? bank ?? undefined;
  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="label" htmlFor="bankName">
          Bank name
        </label>
        <input
          id="bankName"
          name="bankName"
          required
          defaultValue={values?.bankName}
          placeholder="e.g. GTBank, Access Bank, OPay"
          className="input"
        />
      </div>
      <div>
        <label className="label" htmlFor="accountNumber">
          Account number
        </label>
        <input
          id="accountNumber"
          name="accountNumber"
          required
          inputMode="numeric"
          pattern="\d{10}"
          maxLength={10}
          defaultValue={values?.accountNumber}
          placeholder="10 digits"
          className="input font-mono tracking-wider"
        />
      </div>
      <div>
        <label className="label" htmlFor="accountName">
          Account name
        </label>
        <input
          id="accountName"
          name="accountName"
          required
          defaultValue={values?.accountName}
          placeholder="The name customers will see when they transfer"
          className="input"
        />
      </div>
      <FormMessage state={state} />
      <button className="btn" disabled={pending}>
        {pending ? "Saving…" : "Save bank account"}
      </button>
    </form>
  );
}

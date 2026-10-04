"use client";

import { useActionState } from "react";
import { createAdmin, type FormState } from "@/app/actions";
import { FormMessage } from "@/components/AuthForm";

export function SetupForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(createAdmin, {});
  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="label" htmlFor="name">
          Your name
        </label>
        <input
          id="name"
          name="name"
          required
          autoComplete="name"
          defaultValue={state.values?.name}
          className="input"
        />
      </div>
      <div>
        <label className="label" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          defaultValue={state.values?.email}
          className="input"
        />
      </div>
      <div>
        <label className="label" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={10}
          autoComplete="new-password"
          className="input"
        />
        <p className="mt-1 text-xs text-stone-500">At least 10 characters.</p>
      </div>
      <FormMessage state={state} />
      <button className="btn w-full py-3" disabled={pending}>
        {pending ? "Creating…" : "Create admin account"}
      </button>
    </form>
  );
}

"use client";

import { useActionState } from "react";
import { addMenuItem, type FormState } from "@/app/actions";

export function AddItemForm({ categories }: { categories: string[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(addMenuItem, {});
  return (
    <form action={action} className="space-y-3">
      <div>
        <label className="label" htmlFor="name">
          Name
        </label>
        <input id="name" name="name" required className="input" />
      </div>
      <div>
        <label className="label" htmlFor="category">
          Category
        </label>
        <input id="category" name="category" required list="categories" className="input" placeholder="e.g. Mains" />
        <datalist id="categories">
          {categories.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </div>
      <div>
        <label className="label" htmlFor="price">
          Price (₦)
        </label>
        <input id="price" name="price" type="number" step="50" min="50" required className="input" />
      </div>
      <div>
        <label className="label" htmlFor="description">
          Description <span className="font-normal text-stone-400">(optional)</span>
        </label>
        <input id="description" name="description" className="input" />
      </div>
      {state.error && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </p>
      )}
      <button className="btn w-full" disabled={pending}>
        {pending ? "Adding…" : "Add to menu"}
      </button>
    </form>
  );
}

import Link from "next/link";
import { updateMenuItem } from "@/app/actions";
import { requireOwner } from "@/lib/auth";
import { all, type MenuItem } from "@/lib/db";
import { AddItemForm } from "./AddItemForm";

export const metadata = { title: "Manage menu" };

export default async function MenuPage() {
  const { restaurant } = await requireOwner();
  const items = all<MenuItem>(
    "SELECT * FROM menu_items WHERE restaurant_id = ? ORDER BY category, id",
    restaurant.id,
  );
  const categories = [...new Set(items.map((i) => i.category))];

  return (
    <div className="space-y-6">
      <Link href="/dashboard" className="text-sm text-stone-500 hover:text-stone-900">
        ← Dashboard
      </Link>
      <h1 className="text-2xl font-bold tracking-tight">Menu · {restaurant.name}</h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="card divide-y divide-stone-100">
          {items.length === 0 && (
            <p className="p-10 text-center text-stone-500">
              Your menu is empty. Add your first dish to start taking orders.
            </p>
          )}
          {items.map((item) => (
            <div key={item.id} className="flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-40 flex-1">
                <p className={`font-medium ${item.available ? "" : "text-stone-400 line-through"}`}>
                  {item.name}
                </p>
                <p className="text-sm text-stone-500">{item.category}</p>
              </div>
              <form action={updateMenuItem} className="flex flex-wrap items-center gap-2">
                <input type="hidden" name="itemId" value={item.id} />
                <input
                  name="price"
                  type="number"
                  step="50"
                  min="50"
                  defaultValue={item.price / 100}
                  aria-label={`Price of ${item.name}`}
                  className="input w-28 py-2"
                />
                <button name="intent" value="price" className="btn-ghost">
                  Save
                </button>
                <button name="intent" value="toggle" className="btn-ghost w-36">
                  {item.available ? "Mark sold out" : "Mark available"}
                </button>
              </form>
            </div>
          ))}
        </div>

        <aside className="card h-fit p-5">
          <h2 className="mb-4 font-semibold">Add a dish</h2>
          <AddItemForm categories={categories} />
        </aside>
      </div>
    </div>
  );
}

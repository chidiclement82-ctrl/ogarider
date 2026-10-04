import Link from "next/link";
import { notFound } from "next/navigation";
import { Picture } from "@/components/Picture";
import { requireAdmin } from "@/lib/auth";
import { all, get, type MenuItem, type Restaurant } from "@/lib/db";
import { money } from "@/lib/format";
import { deleteMenuItem, removeRestaurant } from "../../actions";
import { MenuItemForm, RestaurantForm, RestaurantLoginForm } from "../../forms";

export default async function EditRestaurantPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const restaurant = get<Restaurant>(
    "SELECT * FROM restaurants WHERE id = ? AND archived = 0",
    Number(id),
  );
  if (!restaurant) notFound();

  const items = all<MenuItem>(
    "SELECT * FROM menu_items WHERE restaurant_id = ? ORDER BY category, id",
    restaurant.id,
  );
  const categories = [...new Set(items.map((i) => i.category))];
  const owner = restaurant.owner_id
    ? get<{ email: string }>("SELECT email FROM users WHERE id = ?", restaurant.owner_id)
    : undefined;

  return (
    <div className="space-y-6">
      <Link href="/admin" className="text-sm text-stone-500 hover:text-stone-900">
        ← Restaurants
      </Link>
      <header className="flex flex-wrap items-center gap-4">
        <Picture
          image={restaurant.image}
          emoji={restaurant.emoji}
          color={restaurant.color}
          className="size-16 shrink-0 rounded-2xl text-3xl"
        />
        <h1 className="mr-auto text-2xl font-bold tracking-tight">{restaurant.name}</h1>
        <Link href={`/restaurants/${restaurant.id}`} className="btn-ghost">
          View as customer
        </Link>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <section className="card p-4 sm:p-6">
            <h2 className="mb-4 font-semibold">Details</h2>
            <RestaurantForm key={restaurant.image} restaurant={restaurant} />
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="font-semibold">
                Menu · {items.length} {items.length === 1 ? "dish" : "dishes"}
              </h2>
              <a href="#add-dish" className="btn-ghost lg:hidden">
                + Add a dish
              </a>
            </div>
            {items.length === 0 ? (
              <p className="card p-8 text-center text-stone-500">
                No dishes yet. Add the first one with the form on this page.
              </p>
            ) : (
              <ul className="card divide-y divide-stone-100">
                {items.map((item) => (
                  <li key={item.id}>
                    <details className="group">
                      <summary className="flex cursor-pointer list-none items-center gap-3 p-3 hover:bg-stone-50 sm:gap-4 sm:p-4">
                        <Picture
                          image={item.image}
                          emoji={item.emoji}
                          className="size-12 shrink-0 rounded-xl text-2xl"
                        />
                        <div className="min-w-0 flex-1">
                          <p className={`font-medium ${item.available ? "" : "text-stone-400"}`}>
                            {item.name}
                            {!item.available && <span className="ml-2 text-xs font-normal">Sold out</span>}
                          </p>
                          <p className="text-sm text-stone-500">{item.category}</p>
                        </div>
                        <span className="font-semibold tabular-nums">{money(item.price)}</span>
                        <span className="text-sm text-orange-700 group-open:hidden">Edit</span>
                        <span className="hidden text-sm text-stone-500 group-open:inline">Close</span>
                      </summary>
                      <div className="space-y-3 border-t border-stone-100 bg-stone-50 p-4">
                        <MenuItemForm
                          key={`${item.image}-${item.price}`}
                          restaurantId={restaurant.id}
                          item={item}
                          categories={categories}
                        />
                        <form action={deleteMenuItem}>
                          <input type="hidden" name="itemId" value={item.id} />
                          <button className="text-sm font-medium text-red-700 hover:underline">
                            Delete this dish
                          </button>
                        </form>
                      </div>
                    </details>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="h-fit space-y-6">
          <section id="add-dish" className="card scroll-mt-20 p-4 sm:p-6">
            <h2 className="mb-4 font-semibold">Add a dish</h2>
            <MenuItemForm restaurantId={restaurant.id} categories={categories} />
          </section>

          <section className="card p-6">
            <h2 className="font-semibold">Restaurant login</h2>
            <p className="mb-4 mt-1 text-sm text-stone-500">
              {owner
                ? "The restaurant signs in with this email to receive and update its orders."
                : "Optional. Lets the restaurant sign in to receive and update its own orders."}
            </p>
            <RestaurantLoginForm restaurantId={restaurant.id} email={owner?.email ?? ""} />
          </section>

          <section className="card p-6">
            <h2 className="font-semibold">Remove restaurant</h2>
            <p className="mb-4 mt-1 text-sm text-stone-500">
              Customers will no longer see it. Past orders are kept.
            </p>
            <form action={removeRestaurant}>
              <input type="hidden" name="restaurantId" value={restaurant.id} />
              <button className="rounded-full border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50">
                Remove from app
              </button>
            </form>
          </section>
        </aside>
      </div>
    </div>
  );
}

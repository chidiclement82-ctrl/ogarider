import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCartButton, MenuCart } from "@/components/MenuCart";
import { Picture } from "@/components/Picture";
import { all, get, type MenuItem, type Restaurant } from "@/lib/db";
import { money } from "@/lib/format";

export default async function RestaurantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const restaurant = get<Restaurant>(
    "SELECT * FROM restaurants WHERE id = ? AND archived = 0",
    Number(id),
  );
  if (!restaurant) notFound();

  const items = all<MenuItem>(
    "SELECT * FROM menu_items WHERE restaurant_id = ? ORDER BY id",
    restaurant.id,
  );
  const categories = [...new Set(items.map((i) => i.category))];
  const ref = { id: restaurant.id, name: restaurant.name, deliveryFee: restaurant.delivery_fee };

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <Link href="/" className="text-sm text-stone-500 hover:text-stone-900">
        ← All restaurants
      </Link>

      <header className="card flex items-center gap-4 p-4 sm:gap-5 sm:p-5">
        <Picture
          image={restaurant.image}
          emoji={restaurant.emoji}
          color={restaurant.color}
          className="size-20 shrink-0 rounded-2xl text-4xl"
        />
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{restaurant.name}</h1>
          <p className="text-sm text-stone-500">{restaurant.description}</p>
          <p className="mt-1.5 text-sm text-stone-700">
            ★ {restaurant.rating.toFixed(1)} · {restaurant.cuisine} · {restaurant.eta_minutes} min ·{" "}
            {money(restaurant.delivery_fee)} delivery
          </p>
        </div>
      </header>

      {!restaurant.is_open && (
        <p className="rounded-2xl bg-stone-900 px-5 py-3 text-sm text-white">
          This restaurant is closed right now and is not taking orders.
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-8">
          {items.length === 0 && (
            <p className="card p-10 text-center text-stone-500">No dishes on the menu yet.</p>
          )}
          {categories.map((category) => (
            <section key={category}>
              <h2 className="mb-3 text-lg font-semibold">{category}</h2>
              <ul className="card divide-y divide-stone-100">
                {items
                  .filter((i) => i.category === category)
                  .map((item) => (
                    <li key={item.id} className="flex items-center gap-3 p-3 sm:gap-4 sm:p-4">
                      <Picture
                        image={item.image}
                        emoji={item.emoji}
                        className="size-16 shrink-0 rounded-xl text-3xl"
                      />
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium">{item.name}</h3>
                        <p className="line-clamp-2 text-sm text-stone-500">{item.description}</p>
                        <p className="mt-1 text-sm font-semibold">
                          {money(item.price)}
                          {!item.available && (
                            <span className="ml-2 font-normal text-stone-500">Sold out</span>
                          )}
                        </p>
                      </div>
                      <AddToCartButton
                        restaurant={ref}
                        item={{ id: item.id, name: item.name, price: item.price }}
                        disabled={!item.available || !restaurant.is_open}
                      />
                    </li>
                  ))}
              </ul>
            </section>
          ))}
        </div>
        <MenuCart restaurant={ref} />
      </div>
    </div>
  );
}

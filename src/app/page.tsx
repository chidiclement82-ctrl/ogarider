import Link from "next/link";
import { Picture } from "@/components/Picture";
import { all, type Restaurant } from "@/lib/db";
import { money } from "@/lib/format";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; cuisine?: string }>;
}) {
  const { q = "", cuisine = "" } = await searchParams;
  const term = `%${q.trim()}%`;

  const cuisines = all<{ cuisine: string }>(
    "SELECT DISTINCT cuisine FROM restaurants WHERE archived = 0 ORDER BY cuisine",
  ).map((r) => r.cuisine);

  // Matches the restaurant itself or any dish on its menu.
  const restaurants = all<Restaurant>(
    `SELECT r.* FROM restaurants r
      WHERE r.archived = 0
        AND (? = '' OR r.cuisine = ?)
        AND (r.name LIKE ? OR r.cuisine LIKE ? OR EXISTS (
              SELECT 1 FROM menu_items m WHERE m.restaurant_id = r.id AND m.name LIKE ?))
      ORDER BY r.is_open DESC, r.rating DESC`,
    cuisine,
    cuisine,
    term,
    term,
    term,
  );

  const chip = (active: boolean) =>
    `rounded-full border px-4 py-1.5 text-sm font-medium transition ${
      active
        ? "border-stone-900 bg-stone-900 text-white"
        : "border-stone-300 bg-white text-stone-700 hover:bg-stone-100"
    }`;
  const href = (c: string) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (c) params.set("cuisine", c);
    const qs = params.toString();
    return qs ? `/?${qs}` : "/";
  };

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-orange-600 px-6 py-10 text-white sm:px-10">
        <h1 className="max-w-xl text-3xl font-bold tracking-tight sm:text-4xl">
          Any food, from any restaurant, delivered to your door.
        </h1>
        <p className="mt-2 text-orange-100">Pick a restaurant, fill your cart, track your order.</p>
        <form action="/" className="mt-6 flex max-w-xl gap-2">
          {cuisine && <input type="hidden" name="cuisine" value={cuisine} />}
          <input
            name="q"
            defaultValue={q}
            placeholder="Search restaurants or dishes"
            className="input border-transparent text-stone-900"
          />
          <button className="rounded-xl bg-stone-900 px-5 text-sm font-semibold hover:bg-stone-800">
            Search
          </button>
        </form>
      </section>

      <nav className="flex flex-wrap gap-2" aria-label="Cuisine">
        <Link href={href("")} className={chip(!cuisine)}>
          All
        </Link>
        {cuisines.map((c) => (
          <Link key={c} href={href(c)} className={chip(c === cuisine)}>
            {c}
          </Link>
        ))}
      </nav>

      {restaurants.length === 0 ? (
        <p className="card p-10 text-center text-stone-500">
          No restaurants match your search.{" "}
          <Link href="/" className="font-medium text-orange-700 underline">
            Clear filters
          </Link>
        </p>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {restaurants.map((r) => (
            <li key={r.id}>
              <Link
                href={`/restaurants/${r.id}`}
                className="card group block overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="relative">
                  <Picture image={r.image} emoji={r.emoji} color={r.color} className="h-36 w-full text-6xl" />
                  {!r.is_open && (
                    <span className="absolute left-3 top-3 rounded-full bg-stone-900 px-2.5 py-1 text-xs font-medium text-white">
                      Closed
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="font-semibold">{r.name}</h2>
                    <span className="shrink-0 text-sm font-medium">★ {r.rating.toFixed(1)}</span>
                  </div>
                  <p className="mt-0.5 line-clamp-1 text-sm text-stone-500">{r.description}</p>
                  <p className="mt-3 text-xs text-stone-600">
                    {r.cuisine} · {r.eta_minutes} min · {money(r.delivery_fee)} delivery
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

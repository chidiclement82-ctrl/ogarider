import Link from "next/link";
import { RestaurantForm } from "../../forms";

export const metadata = { title: "Add restaurant" };

export default function NewRestaurantPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link href="/admin" className="text-sm text-stone-500 hover:text-stone-900">
        ← Restaurants
      </Link>
      <h1 className="text-xl font-bold tracking-tight">Add a restaurant</h1>
      <div className="card p-6">
        <RestaurantForm />
      </div>
      <p className="text-sm text-stone-500">You can add its dishes and prices on the next screen.</p>
    </div>
  );
}

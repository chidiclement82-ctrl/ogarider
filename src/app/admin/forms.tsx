"use client";

import { useActionState } from "react";
import type { FormState } from "@/app/actions";
import { FormMessage } from "@/components/AuthForm";
import { saveMenuItem, saveRestaurant, saveRestaurantLogin } from "./actions";

const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp";
const fileInput =
  "block w-full text-sm text-stone-600 file:mr-3 file:rounded-full file:border-0 file:bg-stone-100 file:px-4 file:py-2 file:text-sm file:font-medium hover:file:bg-stone-200";

type RestaurantValues = {
  id: number;
  name: string;
  cuisine: string;
  description: string;
  delivery_fee: number;
  eta_minutes: number;
  image: string;
};

export function RestaurantForm({ restaurant }: { restaurant?: RestaurantValues }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveRestaurant, {});
  return (
    <form action={action} className="space-y-4">
      {restaurant && <input type="hidden" name="restaurantId" value={restaurant.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="r-name">
            Restaurant name
          </label>
          <input id="r-name" name="name" required defaultValue={restaurant?.name} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="r-cuisine">
            Cuisine
          </label>
          <input
            id="r-cuisine"
            name="cuisine"
            required
            defaultValue={restaurant?.cuisine}
            placeholder="e.g. Nigerian, Grills, Fast food"
            className="input"
          />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="r-description">
          Short description
        </label>
        <input
          id="r-description"
          name="description"
          defaultValue={restaurant?.description}
          className="input"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="r-fee">
            Delivery fee (₦)
          </label>
          <input
            id="r-fee"
            name="deliveryFee"
            type="number"
            min="0"
            step="50"
            required
            defaultValue={restaurant ? restaurant.delivery_fee / 100 : 1000}
            className="input"
          />
        </div>
        <div>
          <label className="label" htmlFor="r-eta">
            Delivery time (minutes)
          </label>
          <input
            id="r-eta"
            name="eta"
            type="number"
            min="5"
            max="180"
            required
            defaultValue={restaurant?.eta_minutes ?? 30}
            className="input"
          />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="r-image">
          Picture{" "}
          <span className="font-normal text-stone-400">
            ({restaurant?.image ? "choose a file to replace the current one" : "JPG, PNG or WebP, up to 4 MB"})
          </span>
        </label>
        <input id="r-image" name="image" type="file" accept={IMAGE_ACCEPT} className={fileInput} />
      </div>
      <FormMessage state={state} />
      <button className="btn" disabled={pending}>
        {pending ? "Saving…" : restaurant ? "Save details" : "Add restaurant"}
      </button>
    </form>
  );
}

type ItemValues = {
  id: number;
  name: string;
  category: string;
  description: string;
  price: number;
  available: number;
  image: string;
};

export function MenuItemForm({
  restaurantId,
  item,
  categories,
}: {
  restaurantId: number;
  item?: ItemValues;
  categories: string[];
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveMenuItem, {});
  const uid = item ? `item-${item.id}` : "item-new";
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="restaurantId" value={restaurantId} />
      {item && <input type="hidden" name="itemId" value={item.id} />}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor={`${uid}-name`}>
            Dish name
          </label>
          <input id={`${uid}-name`} name="name" required defaultValue={item?.name} className="input" />
        </div>
        <div>
          <label className="label" htmlFor={`${uid}-price`}>
            Price (₦)
          </label>
          <input
            id={`${uid}-price`}
            name="price"
            type="number"
            min="50"
            step="50"
            required
            defaultValue={item ? item.price / 100 : undefined}
            className="input"
          />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor={`${uid}-category`}>
            Category
          </label>
          <input
            id={`${uid}-category`}
            name="category"
            required
            list={`${uid}-categories`}
            defaultValue={item?.category}
            placeholder="e.g. Rice, Swallow, Drinks"
            className="input"
          />
          <datalist id={`${uid}-categories`}>
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
        <div>
          <label className="label" htmlFor={`${uid}-description`}>
            Description
          </label>
          <input
            id={`${uid}-description`}
            name="description"
            defaultValue={item?.description}
            className="input"
          />
        </div>
      </div>
      <div>
        <label className="label" htmlFor={`${uid}-image`}>
          Picture{" "}
          <span className="font-normal text-stone-400">
            ({item?.image ? "choose a file to replace the current one" : "JPG, PNG or WebP, up to 4 MB"})
          </span>
        </label>
        <input id={`${uid}-image`} name="image" type="file" accept={IMAGE_ACCEPT} className={fileInput} />
      </div>
      {item && (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="available"
            defaultChecked={!!item.available}
            className="size-4 accent-orange-600"
          />
          Available to order
        </label>
      )}
      {!item && <input type="hidden" name="available" value="1" />}
      <FormMessage state={state} />
      <button className={item ? "btn-ghost" : "btn"} disabled={pending}>
        {pending ? "Saving…" : item ? "Save dish" : "Add dish"}
      </button>
    </form>
  );
}

export function RestaurantLoginForm({
  restaurantId,
  email,
}: {
  restaurantId: number;
  email: string;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveRestaurantLogin, {});
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="restaurantId" value={restaurantId} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="login-email">
            Login email
          </label>
          <input
            id="login-email"
            name="email"
            type="email"
            required
            defaultValue={email}
            autoComplete="off"
            className="input"
          />
        </div>
        <div>
          <label className="label" htmlFor="login-password">
            {email ? "New password" : "Password"}
          </label>
          <input
            id="login-password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="input"
          />
        </div>
      </div>
      <FormMessage state={state} />
      <button className="btn-ghost" disabled={pending}>
        {pending ? "Saving…" : email ? "Update login" : "Create login"}
      </button>
    </form>
  );
}

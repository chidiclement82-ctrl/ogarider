import type { DatabaseSync } from "node:sqlite";
import { hashPassword, verifyPassword } from "./password";

// Demo accounts, created the first time the database is opened.
// Every seeded demo account uses DEMO_PASSWORD.
export const DEMO_PASSWORD = "demo1234";
export const DEMO_CUSTOMER_EMAIL = "customer@demo.test";
export const DEMO_RESTAURANT_EMAIL = "owner@demo.test";
export const DEMO_ADMIN_EMAIL = "admin@demo.test";

// Prices below are in naira and converted to kobo when inserted.
type SeedItem = [category: string, name: string, description: string, emoji: string, naira: number];

type SeedRestaurant = {
  name: string;
  cuisine: string;
  description: string;
  emoji: string;
  color: string;
  deliveryFee: number;
  eta: number;
  rating: number;
  items: SeedItem[];
};

const RESTAURANTS: SeedRestaurant[] = [
  {
    name: "Mama's Kitchen",
    cuisine: "Nigerian",
    description: "Home-style jollof, soups and swallow cooked fresh every day.",
    emoji: "🍛",
    color: "#fed7aa",
    deliveryFee: 1000,
    eta: 35,
    rating: 4.8,
    items: [
      ["Rice", "Jollof Rice & Chicken", "Smoky party jollof with grilled chicken and dodo.", "🍛", 4500],
      ["Rice", "Fried Rice & Turkey", "Vegetable fried rice with peppered turkey.", "🍚", 5500],
      ["Rice", "Ofada Rice & Ayamase", "Local rice with green pepper stew and assorted meat.", "🍲", 5000],
      ["Swallow", "Egusi & Pounded Yam", "Melon seed soup with assorted meat.", "🥘", 5000],
      ["Swallow", "Efo Riro & Semo", "Rich spinach stew with beef and stockfish.", "🥬", 4500],
      ["Sides", "Dodo", "Fried ripe plantain.", "🍌", 1000],
      ["Sides", "Moi Moi", "Steamed bean pudding with egg.", "🫘", 1200],
      ["Drinks", "Zobo", "Chilled hibiscus drink.", "🥤", 800],
    ],
  },
  {
    name: "Suya Republic",
    cuisine: "Grills",
    description: "Charcoal-grilled suya, asun and whole fish, hot off the fire.",
    emoji: "🍢",
    color: "#fecaca",
    deliveryFee: 800,
    eta: 30,
    rating: 4.7,
    items: [
      ["Suya", "Beef Suya", "Spicy skewered beef with onions and yaji.", "🍢", 3000],
      ["Suya", "Chicken Suya", "Boneless chicken, yaji and cabbage.", "🍗", 3500],
      ["Suya", "Kilishi Pack", "Dried spiced beef.", "🥩", 4000],
      ["Grills", "Asun", "Peppered smoked goat meat.", "🌶️", 4500],
      ["Grills", "Grilled Catfish", "Whole point-and-kill with pepper sauce.", "🐟", 8500],
      ["Grills", "Barbecue Turkey Wings", "Two wings with chips.", "🍗", 6000],
      ["Drinks", "Chapman", "Classic Nigerian cocktail.", "🍹", 1500],
    ],
  },
  {
    name: "Amala Joint",
    cuisine: "Swallow",
    description: "Proper buka food: amala, ewedu, gbegiri and plenty of meat.",
    emoji: "🥘",
    color: "#fde68a",
    deliveryFee: 700,
    eta: 25,
    rating: 4.6,
    items: [
      ["Swallow", "Amala, Ewedu & Gbegiri", "Abula with two pieces of beef.", "🥘", 3500],
      ["Swallow", "Pounded Yam & Ogbono", "Draw soup with assorted meat.", "🍲", 4500],
      ["Swallow", "Eba & Okra Soup", "With fresh fish.", "🐟", 4000],
      ["Swallow", "Fufu & Banga Soup", "Palm nut soup with dried fish.", "🥣", 4500],
      ["Extras", "Extra Beef", "One piece.", "🥩", 700],
      ["Extras", "Ponmo", "One piece.", "🍖", 500],
      ["Extras", "Goat Meat", "One piece.", "🍖", 1200],
      ["Drinks", "Bottled Water", "75cl.", "💧", 300],
    ],
  },
  {
    name: "Chop Life Burgers",
    cuisine: "Fast food",
    description: "Burgers, fried chicken, shawarma and loaded fries.",
    emoji: "🍔",
    color: "#bfdbfe",
    deliveryFee: 1200,
    eta: 30,
    rating: 4.5,
    items: [
      ["Burgers", "Classic Beef Burger", "Beef patty, cheese, lettuce, house sauce.", "🍔", 4500],
      ["Burgers", "Double Cheese Burger", "Two patties, double cheddar.", "🍔", 6500],
      ["Burgers", "Crispy Chicken Burger", "Fried chicken thigh, slaw, mayo.", "🍗", 5000],
      ["Shawarma", "Chicken Shawarma", "With one sausage.", "🌯", 3500],
      ["Shawarma", "Beef Shawarma", "With two sausages.", "🌯", 4000],
      ["Chicken", "Fried Chicken (3 pcs)", "Crispy, with chips.", "🍗", 5500],
      ["Sides", "Loaded Fries", "Cheese sauce and suya spice.", "🍟", 2500],
      ["Drinks", "Soft Drink", "50cl bottle.", "🥤", 600],
    ],
  },
  {
    name: "Lagos Pizza Co.",
    cuisine: "Pizza",
    description: "Hand-stretched pizzas with a Naija twist.",
    emoji: "🍕",
    color: "#fbcfe8",
    deliveryFee: 1500,
    eta: 40,
    rating: 4.4,
    items: [
      ["Pizza", "Margherita", "Tomato, mozzarella, basil.", "🍕", 7500],
      ["Pizza", "Pepperoni", "Beef pepperoni and mozzarella.", "🍕", 9000],
      ["Pizza", "Suya Pizza", "Beef suya, onions, yaji drizzle.", "🌶️", 9500],
      ["Pizza", "Chicken BBQ", "Grilled chicken, sweet corn, barbecue sauce.", "🍗", 9500],
      ["Pasta", "Jollof Spaghetti", "Peppered spaghetti with chicken.", "🍝", 4500],
      ["Sides", "Garlic Bread", "With herb butter.", "🥖", 2000],
      ["Drinks", "Malt", "33cl can.", "🥫", 800],
    ],
  },
  {
    name: "Fresh & Fit",
    cuisine: "Healthy",
    description: "Salads, fruit bowls, parfaits and fresh juices.",
    emoji: "🥗",
    color: "#d9f99d",
    deliveryFee: 1000,
    eta: 20,
    rating: 4.7,
    items: [
      ["Bowls", "Chicken Salad Bowl", "Grilled chicken, lettuce, sweet corn, egg.", "🥗", 4500],
      ["Bowls", "Fruit Bowl", "Pineapple, watermelon, pawpaw, apple.", "🍉", 2500],
      ["Bowls", "Yoghurt Parfait", "Greek yoghurt, granola, berries.", "🍓", 3500],
      ["Wraps", "Grilled Fish Wrap", "Whole-wheat wrap with croaker and veggies.", "🌯", 4000],
      ["Drinks", "Pineapple & Ginger Juice", "Cold-pressed, no added sugar.", "🍍", 2000],
      ["Drinks", "Tiger Nut Milk", "Kunu aya with dates.", "🥛", 1800],
      ["Drinks", "Green Smoothie", "Spinach, cucumber, apple, ginger.", "🥒", 2500],
    ],
  },
];

/**
 * Makes sure the admin from ADMIN_EMAIL / ADMIN_PASSWORD exists with that password.
 * Runs at every start, so the variables can be added or changed after the first
 * deploy, and changing ADMIN_PASSWORD is how a forgotten admin password is reset.
 */
export function ensureAdmin(conn: DatabaseSync) {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return;

  const existing = conn
    .prepare("SELECT id, role, password_hash FROM users WHERE email = ?")
    .get(email) as { id: number; role: string; password_hash: string } | undefined;
  if (!existing) {
    conn
      .prepare("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'admin')")
      .run("Admin", email, hashPassword(password));
  } else if (existing.role !== "admin" || !verifyPassword(password, existing.password_hash)) {
    conn
      .prepare("UPDATE users SET role = 'admin', password_hash = ? WHERE id = ?")
      .run(hashPassword(password), existing.id);
  }
}

export function seed(conn: DatabaseSync) {
  const addUser = conn.prepare(
    "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
  );
  const addRestaurant = conn.prepare(
    `INSERT INTO restaurants
       (owner_id, name, cuisine, description, emoji, color, delivery_fee, eta_minutes, rating)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  const addItem = conn.prepare(
    `INSERT INTO menu_items (restaurant_id, category, name, description, emoji, price)
     VALUES (?, ?, ?, ?, ?, ?)`,
  );

  const passwordHash = hashPassword(DEMO_PASSWORD);

  conn.exec("BEGIN");

  // Demo accounts share a publicly known password, so production starts without them
  // (and without the demo restaurants they own).
  if (process.env.NODE_ENV === "production") {
    conn.exec("COMMIT");
    return;
  }

  addUser.run("Demo Customer", DEMO_CUSTOMER_EMAIL, passwordHash, "customer");
  addUser.run("Demo Admin", DEMO_ADMIN_EMAIL, passwordHash, "admin");

  RESTAURANTS.forEach((r, i) => {
    const email = i === 0 ? DEMO_RESTAURANT_EMAIL : `owner${i + 1}@demo.test`;
    const ownerId = addUser.run(`${r.name} Owner`, email, passwordHash, "restaurant")
      .lastInsertRowid;
    const restaurantId = addRestaurant.run(
      ownerId,
      r.name,
      r.cuisine,
      r.description,
      r.emoji,
      r.color,
      r.deliveryFee * 100,
      r.eta,
      r.rating,
    ).lastInsertRowid;
    for (const [category, name, description, emoji, naira] of r.items) {
      addItem.run(restaurantId, category, name, description, emoji, naira * 100);
    }
  });
  conn.exec("COMMIT");
}

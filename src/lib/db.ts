import "server-only";
import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { seed } from "./seed";
import type { OrderStatus, PaymentMethod } from "./format";

// On a server, point DATA_DIR at a persistent disk so the database and pictures survive redeploys.
export const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");

export type User = {
  id: number;
  name: string;
  email: string;
  role: "customer" | "restaurant" | "admin";
};

export type Restaurant = {
  id: number;
  owner_id: number | null;
  name: string;
  cuisine: string;
  description: string;
  emoji: string;
  color: string;
  image: string;
  delivery_fee: number;
  eta_minutes: number;
  rating: number;
  is_open: number;
  archived: number;
};

export type MenuItem = {
  id: number;
  restaurant_id: number;
  category: string;
  name: string;
  description: string;
  emoji: string;
  image: string;
  price: number;
  available: number;
};

export type Order = {
  id: number;
  user_id: number;
  restaurant_id: number;
  status: OrderStatus;
  subtotal: number;
  delivery_fee: number;
  total: number;
  address: string;
  phone: string;
  notes: string;
  payment_method: PaymentMethod;
  paid: number;
  payment_ref: string;
  created_at: string;
};

export type OrderItem = {
  id: number;
  order_id: number;
  menu_item_id: number;
  name: string;
  price: number;
  qty: number;
};

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('customer', 'restaurant', 'admin'))
);
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  expires_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS restaurants (
  id INTEGER PRIMARY KEY,
  owner_id INTEGER REFERENCES users(id),
  name TEXT NOT NULL,
  cuisine TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  emoji TEXT NOT NULL DEFAULT '🍽️',
  color TEXT NOT NULL DEFAULT '#fed7aa',
  image TEXT NOT NULL DEFAULT '',
  delivery_fee INTEGER NOT NULL DEFAULT 100000,
  eta_minutes INTEGER NOT NULL DEFAULT 30,
  rating REAL NOT NULL DEFAULT 4.5,
  is_open INTEGER NOT NULL DEFAULT 1,
  archived INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS menu_items (
  id INTEGER PRIMARY KEY,
  restaurant_id INTEGER NOT NULL REFERENCES restaurants(id),
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  emoji TEXT NOT NULL DEFAULT '🍽️',
  image TEXT NOT NULL DEFAULT '',
  price INTEGER NOT NULL,
  available INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  restaurant_id INTEGER NOT NULL REFERENCES restaurants(id),
  status TEXT NOT NULL DEFAULT 'pending',
  subtotal INTEGER NOT NULL,
  delivery_fee INTEGER NOT NULL,
  total INTEGER NOT NULL,
  address TEXT NOT NULL,
  phone TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  payment_method TEXT NOT NULL DEFAULT 'cod',
  paid INTEGER NOT NULL DEFAULT 0,
  payment_ref TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);
-- menu_item_id is informational only: dishes can be deleted after they were ordered.
CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id),
  menu_item_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  price INTEGER NOT NULL,
  qty INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
-- A customer's claim that they transferred money to the business bank account.
CREATE TABLE IF NOT EXISTS topups (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  amount INTEGER NOT NULL,
  sender_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  amount INTEGER NOT NULL,
  kind TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_wallet_user ON wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_menu_restaurant ON menu_items(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_restaurant ON orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_ref ON orders(payment_ref);
`;

/** Orders a restaurant should see: paid (online or from the wallet), or pay-on-delivery. */
export const VISIBLE_TO_RESTAURANT = "(o.payment_method = 'cod' OR o.paid = 1)";

// Kept on globalThis so dev hot-reloads reuse one connection.
const globalForDb = globalThis as unknown as { __db?: DatabaseSync };

function connection() {
  if (!globalForDb.__db) {
    mkdirSync(DATA_DIR, { recursive: true });
    const conn = new DatabaseSync(path.join(DATA_DIR, "app.db"));
    conn.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");
    conn.exec(SCHEMA);
    const { n } = conn.prepare("SELECT COUNT(*) AS n FROM users").get() as {
      n: number;
    };
    if (n === 0) seed(conn);
    globalForDb.__db = conn;
  }
  return globalForDb.__db;
}

// node:sqlite rows have a null prototype, which React refuses to pass to Client
// Components, so rows are copied into plain objects.
export function all<T>(sql: string, ...params: SQLInputValue[]) {
  return connection().prepare(sql).all(...params).map((row) => ({ ...row })) as T[];
}

export function get<T>(sql: string, ...params: SQLInputValue[]) {
  const row = connection().prepare(sql).get(...params);
  return row && ({ ...row } as T);
}

/** Runs a write and returns the new row id. */
export function run(sql: string, ...params: SQLInputValue[]) {
  return Number(connection().prepare(sql).run(...params).lastInsertRowid);
}

/** Runs a write and returns how many rows it changed. */
export function change(sql: string, ...params: SQLInputValue[]) {
  return Number(connection().prepare(sql).run(...params).changes);
}

export function transaction<T>(fn: () => T): T {
  const conn = connection();
  conn.exec("BEGIN");
  try {
    const result = fn();
    conn.exec("COMMIT");
    return result;
  } catch (err) {
    conn.exec("ROLLBACK");
    throw err;
  }
}

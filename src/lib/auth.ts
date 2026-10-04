import "server-only";
import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { get, run, type Restaurant, type User } from "./db";

const COOKIE = "session";
const THIRTY_DAYS = 60 * 60 * 24 * 30;

export async function createSession(userId: number) {
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + THIRTY_DAYS * 1000).toISOString();
  run("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)", token, userId, expires);
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: THIRTY_DAYS,
    path: "/",
  });
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (token) run("DELETE FROM sessions WHERE token = ?", token);
  store.delete(COOKIE);
}

export const getUser = cache(async (): Promise<User | null> => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const user = get<User>(
    `SELECT u.id, u.name, u.email, u.role
       FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.token = ? AND s.expires_at > ?`,
    token,
    new Date().toISOString(),
  );
  return user ?? null;
});

export async function requireUser(next: string) {
  const user = await getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

/** The signed-in owner and their restaurant, or a redirect away. */
export async function requireOwner() {
  const user = await requireUser("/dashboard");
  const restaurant = get<Restaurant>(
    "SELECT * FROM restaurants WHERE owner_id = ? AND archived = 0",
    user.id,
  );
  if (!restaurant) redirect("/");
  return { user, restaurant };
}

export async function requireAdmin() {
  const user = await requireUser("/admin");
  if (user.role !== "admin") redirect("/");
  return user;
}

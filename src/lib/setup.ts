import "server-only";
import { get } from "./db";
import { DEMO_ADMIN_EMAIL } from "./seed";

/**
 * The first-run admin setup page is open only in development and only until a real
 * admin exists. In production the admin comes from ADMIN_EMAIL / ADMIN_PASSWORD.
 */
export function setupAllowed() {
  if (process.env.NODE_ENV === "production") return false;
  return !get("SELECT 1 FROM users WHERE role = 'admin' AND email <> ?", DEMO_ADMIN_EMAIL);
}

import "server-only";
import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { DATA_DIR } from "./db";

export const UPLOAD_DIR = path.join(DATA_DIR, "uploads");
export const UPLOAD_NAME = /^[a-f0-9]{32}\.(jpg|png|webp)$/;
export const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const MAX_BYTES = 4 * 1024 * 1024;

/**
 * Stores an uploaded picture and returns its file name.
 * Returns "" when no file was chosen, and throws a readable error for bad files.
 */
export async function saveImage(entry: FormDataEntryValue | null) {
  if (!(entry instanceof File) || entry.size === 0) return "";
  const ext = IMAGE_TYPES[entry.type];
  if (!ext) throw new Error("Pictures must be JPG, PNG or WebP.");
  if (entry.size > MAX_BYTES) throw new Error("Pictures must be smaller than 4 MB.");

  const name = `${randomBytes(16).toString("hex")}.${ext}`;
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, name), Buffer.from(await entry.arrayBuffer()));
  return name;
}

import { readFile } from "node:fs/promises";
import path from "node:path";
import { IMAGE_TYPES, UPLOAD_DIR, UPLOAD_NAME } from "@/lib/uploads";

const TYPE_BY_EXT = Object.fromEntries(Object.entries(IMAGE_TYPES).map(([type, ext]) => [ext, type]));

export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  if (!UPLOAD_NAME.test(name)) return new Response("Not found", { status: 404 });
  try {
    const file = await readFile(path.join(UPLOAD_DIR, name));
    return new Response(new Uint8Array(file), {
      headers: {
        "Content-Type": TYPE_BY_EXT[name.split(".")[1]],
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}

import { readFile } from "node:fs/promises";
import path from "node:path";

/** Serves admin-uploaded images from storage/uploads (kept outside /public so uploads work after a build). */
const ROOT = path.join(process.cwd(), "storage", "uploads");
const TYPES: Record<string, string> = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".avif": "image/avif" };

export async function GET(_: Request, { params }: RouteContext<"/media/[...path]">) {
  const parts = (await params).path;
  const file = path.normalize(path.join(ROOT, ...parts));
  const type = TYPES[path.extname(file).toLowerCase()];
  if (!file.startsWith(ROOT + path.sep) || !type) return new Response("Not found", { status: 404 });
  try {
    const data = await readFile(file);
    return new Response(new Uint8Array(data), {
      headers: { "Content-Type": type, "Cache-Control": "public, max-age=31536000, immutable" },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}

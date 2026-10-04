import { ImageResponse } from "next/og";

// App icons for the home screen and the app stores, drawn on the fly so there are no
// image files to keep in sync. "maskable" icons keep the logo inside Android's safe zone.
const ICONS: Record<string, { size: number; maskable: boolean }> = {
  "192.png": { size: 192, maskable: false },
  "512.png": { size: 512, maskable: false },
  "maskable-512.png": { size: 512, maskable: true },
  "apple-180.png": { size: 180, maskable: true },
};

export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const icon = ICONS[name];
  if (!icon) return new Response("Not found", { status: 404 });

  const { size, maskable } = icon;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#ea580c",
          borderRadius: maskable ? 0 : size * 0.22,
          color: "#ffffff",
          fontSize: size * (maskable ? 0.5 : 0.62),
          fontWeight: 700,
        }}
      >
        O
      </div>
    ),
    {
      width: size,
      height: size,
      headers: { "Cache-Control": "public, max-age=86400" },
    },
  );
}

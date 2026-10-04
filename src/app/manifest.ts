import type { MetadataRoute } from "next";
import { APP_NAME } from "@/lib/format";

/** Lets phones "Add to Home Screen", and is what the Play Store app is generated from. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: `${APP_NAME} — food delivery`,
    short_name: APP_NAME,
    description: "Order food from any restaurant and track it to your door.",
    lang: "en-NG",
    categories: ["food", "shopping"],
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fafaf9",
    theme_color: "#ea580c",
    icons: [
      { src: "/icons/192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}

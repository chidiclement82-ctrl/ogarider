import type { MetadataRoute } from "next";
import { APP_NAME } from "@/lib/format";

/** Lets phones "Add to Home Screen" and open the site like an app. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: APP_NAME,
    short_name: APP_NAME,
    description: "Order food from any restaurant and track it to your door.",
    start_url: "/",
    display: "standalone",
    background_color: "#fafaf9",
    theme_color: "#ea580c",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}

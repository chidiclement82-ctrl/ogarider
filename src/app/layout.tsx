import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { Header } from "@/components/Header";
import { ServiceWorker } from "@/components/ServiceWorker";
import { APP_NAME } from "@/lib/format";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: `${APP_NAME} — food from your favourite restaurants`,
  description: "Order food from any restaurant and track it to your door.",
  appleWebApp: { capable: true, title: APP_NAME, statusBarStyle: "default" },
  icons: { apple: "/icons/apple-180.png" },
};

export const viewport: Viewport = {
  themeColor: "#ea580c",
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <ServiceWorker />
        <Header />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-5 sm:py-8">{children}</main>
        <footer className="border-t border-stone-200 pb-24 pt-6 text-center text-xs text-stone-500 sm:pb-6">
          © {new Date().getFullYear()} {APP_NAME} ·{" "}
          <Link href="/privacy" className="underline">
            Privacy
          </Link>{" "}
          ·{" "}
          <Link href="/account" className="underline">
            Account
          </Link>
        </footer>
      </body>
    </html>
  );
}

export const metadata = { title: "You are offline" };

/** Shown by the service worker when a page is requested without a connection. */
export default function OfflinePage() {
  return (
    <div className="mx-auto max-w-sm py-16 text-center">
      <p className="text-5xl">📡</p>
      <h1 className="mt-4 text-2xl font-bold tracking-tight">You are offline</h1>
      <p className="mt-2 text-stone-500">
        Check your internet connection, then try again.
      </p>
      {/* A plain link on purpose: it forces a full reload from the network. */}
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a href="/" className="btn mt-6">
        Try again
      </a>
    </div>
  );
}

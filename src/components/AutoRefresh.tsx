"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Re-fetches the current page's server data on an interval so statuses stay live. */
export function AutoRefresh({ seconds = 5 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const timer = setInterval(() => router.refresh(), seconds * 1000);
    return () => clearInterval(timer);
  }, [router, seconds]);
  return null;
}

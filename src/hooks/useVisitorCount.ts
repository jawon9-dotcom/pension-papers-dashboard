"use client";

import { useEffect, useState } from "react";

const VISITOR_ID_KEY = "pension-dashboard-visitor-id";

function getOrCreateVisitorId(): string {
  const existing = localStorage.getItem(VISITOR_ID_KEY);
  if (existing) return existing;

  const id = crypto.randomUUID();
  localStorage.setItem(VISITOR_ID_KEY, id);
  return id;
}

export function useVisitorCount(): number | null {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function registerVisit() {
      try {
        const visitorId = getOrCreateVisitorId();
        const res = await fetch("/api/visitors", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ visitorId }),
        });

        if (!res.ok) {
          const fallback = await fetch("/api/visitors");
          if (fallback.ok) {
            const data = (await fallback.json()) as { uniqueCount?: number };
            if (!cancelled && typeof data.uniqueCount === "number") {
              setCount(data.uniqueCount);
            }
          }
          return;
        }

        const data = (await res.json()) as { uniqueCount?: number };
        if (!cancelled && typeof data.uniqueCount === "number") {
          setCount(data.uniqueCount);
        }
      } catch {
        // ignore tracking errors
      }
    }

    registerVisit();

    return () => {
      cancelled = true;
    };
  }, []);

  return count;
}

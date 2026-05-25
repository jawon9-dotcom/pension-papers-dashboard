"use client";

import { useEffect, useState } from "react";

const VISITOR_ID_KEY = "pension-dashboard-visitor-id";

let memoryVisitorId: string | null = null;

function createVisitorId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    const value = char === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

function getOrCreateVisitorId(): string {
  if (memoryVisitorId) {
    return memoryVisitorId;
  }

  try {
    const existing = localStorage.getItem(VISITOR_ID_KEY);
    if (existing) {
      memoryVisitorId = existing;
      return existing;
    }

    const id = createVisitorId();
    localStorage.setItem(VISITOR_ID_KEY, id);
    memoryVisitorId = id;
    return id;
  } catch {
    try {
      const existing = sessionStorage.getItem(VISITOR_ID_KEY);
      if (existing) {
        memoryVisitorId = existing;
        return existing;
      }

      const id = createVisitorId();
      sessionStorage.setItem(VISITOR_ID_KEY, id);
      memoryVisitorId = id;
      return id;
    } catch {
      memoryVisitorId = createVisitorId();
      return memoryVisitorId;
    }
  }
}

async function fetchVisitorCount(): Promise<number | null> {
  const res = await fetch("/api/visitors", { cache: "no-store" });
  if (!res.ok) {
    return null;
  }

  const data = (await res.json()) as { uniqueCount?: number };
  return typeof data.uniqueCount === "number" ? data.uniqueCount : null;
}

export function useVisitorCount(): number | null {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function registerVisit() {
      const visitorId = getOrCreateVisitorId();

      try {
        const postRes = await fetch("/api/visitors", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ visitorId }),
          cache: "no-store",
        });

        if (postRes.ok) {
          const data = (await postRes.json()) as { uniqueCount?: number };
          if (!cancelled && typeof data.uniqueCount === "number") {
            setCount(data.uniqueCount);
            return;
          }
        }
      } catch {
        // fall through to GET
      }

      try {
        const uniqueCount = await fetchVisitorCount();
        if (!cancelled && uniqueCount !== null) {
          setCount(uniqueCount);
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

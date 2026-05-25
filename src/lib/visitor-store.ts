const VISITOR_SET_KEY = "pension-dashboard:visitors:v1";

function getRedisConfig(): { url: string; token: string } | null {
  const url =
    process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL ?? "";
  const token =
    process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN ?? "";

  if (!url || !token) {
    return null;
  }

  return { url, token };
}

async function redisCommand<T = unknown>(
  command: (string | number)[]
): Promise<T | null> {
  const config = getRedisConfig();
  if (!config) {
    return null;
  }

  try {
    const res = await fetch(config.url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(command),
      cache: "no-store",
    });

    if (!res.ok) {
      console.warn(
        "Visitor Redis command failed:",
        res.status,
        String(command[0])
      );
      return null;
    }

    const data = (await res.json()) as { result?: T; error?: string };
    if (data.error) {
      console.warn("Visitor Redis error:", data.error);
      return null;
    }

    return data.result ?? null;
  } catch (error) {
    console.warn("Visitor Redis request failed:", error);
    return null;
  }
}

export function isPersistentVisitorStoreAvailable(): boolean {
  return getRedisConfig() !== null;
}

export async function getPersistentVisitorCount(): Promise<number | null> {
  const count = await redisCommand<number>(["SCARD", VISITOR_SET_KEY]);
  return typeof count === "number" ? count : null;
}

export async function trackPersistentVisitor(
  visitorId: string
): Promise<{ uniqueCount: number; isNew: boolean } | null> {
  const added = await redisCommand<number>([
    "SADD",
    VISITOR_SET_KEY,
    visitorId,
  ]);
  if (added === null) {
    return null;
  }

  const uniqueCount = await getPersistentVisitorCount();
  if (uniqueCount === null) {
    return null;
  }

  return { uniqueCount, isNew: added === 1 };
}

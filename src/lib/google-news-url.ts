const GOOGLE_NEWS_HOST = "news.google.com";

const BROWSER_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const decodeCache = new Map<string, string>();

function isValidBase64(value: string): boolean {
  return /^[A-Za-z0-9+/_-]+={0,2}$/.test(value);
}

function normalizeBase64(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4;
  if (padding === 0) return normalized;
  return normalized + "=".repeat(4 - padding);
}

export function isGoogleNewsUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.replace(/^www\./, "") !== GOOGLE_NEWS_HOST) {
      return false;
    }
    return /\/(articles|read)\/[^/?]+/.test(parsed.pathname);
  } catch {
    return false;
  }
}

function extractArticleId(sourceUrl: string): string | null {
  const match = new URL(sourceUrl).pathname.match(/\/(articles|read)\/([^/?]+)/);
  return match?.[2] ?? null;
}

function mergeCookies(existing: string[], response: Response): string[] {
  const jar = new Map<string, string>();

  for (const cookie of existing) {
    const [name, ...rest] = cookie.split("=");
    if (name) jar.set(name, rest.join("="));
  }

  const setCookies =
    typeof response.headers.getSetCookie === "function"
      ? response.headers.getSetCookie()
      : [];

  for (const setCookie of setCookies) {
    const part = setCookie.split(";")[0]?.trim();
    if (!part) continue;
    const [name, ...rest] = part.split("=");
    if (name) jar.set(name, rest.join("="));
  }

  return [...jar.entries()].map(([name, value]) => `${name}=${value}`);
}

function decodeOfflineArticleId(base64: string): string | null {
  if (!base64 || !isValidBase64(base64)) {
    return null;
  }

  let decoded = Buffer.from(normalizeBase64(base64), "base64").toString("binary");
  const prefix = Buffer.from([0x08, 0x13, 0x22]).toString("binary");
  const suffix = Buffer.from([0xd2, 0x01, 0x00]).toString("binary");

  if (decoded.startsWith(prefix)) {
    decoded = decoded.slice(prefix.length);
  }
  if (decoded.endsWith(suffix)) {
    decoded = decoded.slice(0, -suffix.length);
  }

  const bytes = Uint8Array.from(decoded, (char) => char.charCodeAt(0));
  const lengthByte = bytes[0] ?? 0;
  if (lengthByte >= 0x80) {
    decoded = decoded.substring(2, lengthByte + 2);
  } else {
    decoded = decoded.substring(1, lengthByte + 1);
  }

  if (decoded.startsWith("http://") || decoded.startsWith("https://")) {
    return decoded;
  }

  return null;
}

async function fetchDecodingParams(articleId: string): Promise<{
  signature: string;
  timestamp: string;
  cookies: string[];
}> {
  const cookies = ["CONSENT=PENDING+987"];
  const res = await fetch(`https://news.google.com/articles/${articleId}`, {
    headers: {
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "User-Agent": BROWSER_USER_AGENT,
      Cookie: cookies.join("; "),
    },
    redirect: "follow",
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Google News article page fetch failed (${res.status})`);
  }

  const html = await res.text();
  const mergedCookies = mergeCookies(cookies, res);
  const signature = html.match(/data-n-a-sg="([^"]+)"/)?.[1];
  const timestamp = html.match(/data-n-a-ts="([^"]+)"/)?.[1];

  if (!signature || !timestamp) {
    throw new Error("Google News decoding parameters not found");
  }

  return { signature, timestamp, cookies: mergedCookies };
}

function parseBatchexecuteResponse(body: string): string {
  const jsonPart = body.split("\n\n")[1]?.trim();
  if (!jsonPart) {
    throw new Error("Google News decode response body is empty");
  }

  const parsed = JSON.parse(jsonPart) as unknown;
  if (!Array.isArray(parsed) || !Array.isArray(parsed[0])) {
    throw new Error("Google News decode response format is invalid");
  }

  const innerJson = parsed[0][2];
  if (typeof innerJson !== "string") {
    throw new Error("Google News decode inner payload is missing");
  }

  const inner = JSON.parse(innerJson) as unknown;
  if (!Array.isArray(inner) || typeof inner[1] !== "string") {
    throw new Error("Google News decoded URL is missing");
  }

  return inner[1];
}

async function decodeViaBatchexecute(
  articleId: string,
  signature: string,
  timestamp: string,
  cookies: string[]
): Promise<string> {
  const innerJson = JSON.stringify([
    "garturlreq",
    [
      [
        "X",
        "X",
        ["X", "X"],
        null,
        null,
        1,
        1,
        "US:en",
        null,
        1,
        null,
        null,
        null,
        null,
        null,
        0,
        1,
      ],
      "X",
      "X",
      1,
      [1, 1, 1],
      1,
      1,
      null,
      0,
      0,
      null,
      0,
    ],
    articleId,
    Number.parseInt(timestamp, 10),
    signature,
  ]);

  const payload = JSON.stringify([[["Fbv4je", innerJson]]]);
  const res = await fetch(
    "https://news.google.com/_/DotsSplashUi/data/batchexecute",
    {
      method: "POST",
      headers: {
        Accept: "*/*",
        "Accept-Language": "en-US,en;q=0.9",
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        Cookie: cookies.join("; "),
        Origin: "https://news.google.com",
        Referer: "https://news.google.com/",
        "User-Agent": BROWSER_USER_AGENT,
        "x-same-domain": "1",
      },
      body: `f.req=${encodeURIComponent(payload)}`,
      cache: "no-store",
    }
  );

  if (!res.ok) {
    throw new Error(`Google News decode failed (${res.status})`);
  }

  return parseBatchexecuteResponse(await res.text());
}

export async function decodeGoogleNewsUrl(sourceUrl: string): Promise<string> {
  const cached = decodeCache.get(sourceUrl);
  if (cached) return cached;

  const articleId = extractArticleId(sourceUrl);
  if (!articleId) {
    return sourceUrl;
  }

  const offlineUrl = decodeOfflineArticleId(articleId);
  if (offlineUrl) {
    decodeCache.set(sourceUrl, offlineUrl);
    return offlineUrl;
  }

  const { signature, timestamp, cookies } =
    await fetchDecodingParams(articleId);
  const decodedUrl = await decodeViaBatchexecute(
    articleId,
    signature,
    timestamp,
    cookies
  );

  if (
    !decodedUrl.startsWith("http://") &&
    !decodedUrl.startsWith("https://")
  ) {
    throw new Error("Google News decoded URL is invalid");
  }

  decodeCache.set(sourceUrl, decodedUrl);
  return decodedUrl;
}

export async function resolveArticleUrl(sourceUrl: string): Promise<string> {
  if (!isGoogleNewsUrl(sourceUrl)) {
    return sourceUrl;
  }

  return decodeGoogleNewsUrl(sourceUrl);
}

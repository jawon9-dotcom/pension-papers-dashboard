const BLOCKED_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0"]);

const BROWSER_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36";

function isPrivateHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (BLOCKED_HOSTS.has(host)) return true;
  if (host.endsWith(".local")) return true;
  if (host.startsWith("192.168.")) return true;
  if (host.startsWith("10.")) return true;
  if (host.startsWith("172.")) {
    const second = Number(host.split(".")[1]);
    if (second >= 16 && second <= 31) return true;
  }
  return false;
}

export function isAllowedArticleUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) return false;
    return !isPrivateHost(parsed.hostname);
  } catch {
    return false;
  }
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&#(\d+);/g, (_, code) =>
      String.fromCharCode(Number.parseInt(code, 10))
    );
}

function stripTags(html: string): string {
  return decodeHtmlEntities(
    html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]{2,}/g, " ")
      .trim()
  );
}

function extractMetaContent(html: string, property: string): string | null {
  const patterns = [
    new RegExp(
      `<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`,
      "i"
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`,
      "i"
    ),
    new RegExp(
      `<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']+)["']`,
      "i"
    ),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return stripTags(match[1]);
  }

  return null;
}

function extractJsonLdArticleBody(html: string): string | null {
  const scripts = [
    ...html.matchAll(
      /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
    ),
  ];

  for (const script of scripts) {
    try {
      const json = JSON.parse(script[1] ?? "") as unknown;
      const items = Array.isArray(json) ? json : [json];
      for (const item of items) {
        if (!item || typeof item !== "object") continue;
        const record = item as Record<string, unknown>;
        if (
          typeof record.articleBody === "string" &&
          record.articleBody.trim()
        ) {
          return stripTags(record.articleBody);
        }
      }
    } catch {
      continue;
    }
  }

  return null;
}

function extractParagraphs(html: string): string {
  const cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
    .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
    .replace(/<header[\s\S]*?<\/header>/gi, " ");

  const articleMatch = cleaned.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  const mainMatch =
    articleMatch ??
    cleaned.match(/<main[^>]*>([\s\S]*?)<\/main>/i) ??
    cleaned.match(
      /<div[^>]+class=["'][^"']*article[^"']*["'][^>]*>([\s\S]*?)<\/div>/i
    );

  const scope = mainMatch?.[1] ?? cleaned;
  const paragraphs = [...scope.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((match) => stripTags(match[1] ?? ""))
    .filter((text) => text.length >= 40);

  return paragraphs.join("\n\n");
}

export function extractArticleText(html: string): string {
  const candidates = [
    extractJsonLdArticleBody(html),
    extractMetaContent(html, "og:description"),
    extractMetaContent(html, "description"),
    extractMetaContent(html, "twitter:description"),
    (() => {
      const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
      return articleMatch ? stripTags(articleMatch[1] ?? "") : null;
    })(),
    extractParagraphs(html),
  ].filter((value): value is string => Boolean(value && value.trim()));

  const best = candidates.sort((a, b) => b.length - a.length)[0] ?? "";
  return best.slice(0, 20000).trim();
}

function parseJinaReaderText(text: string): string {
  const marker = "Markdown Content:";
  const markerIndex = text.indexOf(marker);
  const body =
    markerIndex >= 0 ? text.slice(markerIndex + marker.length).trim() : text;

  return body
    .replace(/^\s*#\s+/gm, "")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, 20000);
}

async function fetchViaJinaReader(url: string): Promise<string> {
  const readerUrl = `https://r.jina.ai/${url}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);

  try {
    const res = await fetch(readerUrl, {
      headers: {
        Accept: "text/plain",
        "User-Agent": BROWSER_USER_AGENT,
      },
      cache: "no-store",
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`Reader fetch failed (${res.status})`);
    }

    const text = await res.text();
    const content = parseJinaReaderText(text);
    if (content.length < 120) {
      throw new Error("Reader returned insufficient article text");
    }

    return content;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchDirectHtml(url: string): Promise<{
  html: string;
  resolvedUrl: string;
}> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);

  try {
    const res = await fetch(url, {
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": BROWSER_USER_AGENT,
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
      cache: "no-store",
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`기사 페이지를 불러오지 못했습니다. (${res.status})`);
    }

    return {
      html: await res.text(),
      resolvedUrl: res.url || url,
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchArticleContent(url: string): Promise<{
  content: string;
  resolvedUrl: string;
}> {
  if (!isAllowedArticleUrl(url)) {
    throw new Error("허용되지 않은 기사 URL입니다.");
  }

  const { resolveArticleUrl } = await import("./google-news-url");
  const resolvedUrl = await resolveArticleUrl(url);

  if (!isAllowedArticleUrl(resolvedUrl)) {
    throw new Error("기사 URL을 해석하지 못했습니다.");
  }

  try {
    const jinaContent = await fetchViaJinaReader(resolvedUrl);
    return { content: jinaContent, resolvedUrl };
  } catch (jinaError) {
    console.warn("Jina reader failed, falling back to HTML extract:", jinaError);
  }

  const { html, resolvedUrl: finalUrl } = await fetchDirectHtml(resolvedUrl);
  const content = extractArticleText(html);

  if (!content || content.length < 80) {
    throw new Error("기사 본문을 추출하지 못했습니다.");
  }

  return {
    content,
    resolvedUrl: finalUrl,
  };
}

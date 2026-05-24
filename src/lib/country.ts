export const COUNTRY_NAMES_KO: Record<string, string> = {
  US: "미국",
  CA: "캐나다",
  GB: "영국",
  DE: "독일",
  FR: "프랑스",
  NL: "네덜란드",
  SE: "스웨덴",
  NO: "노르웨이",
  DK: "덴마크",
  FI: "핀란드",
  CH: "스위스",
  IT: "이탈리아",
  ES: "스페인",
  AU: "호주",
  NZ: "뉴질랜드",
  JP: "일본",
  KR: "한국",
  CN: "중국",
  IN: "인도",
  KE: "케냐",
  NG: "나이지리아",
  ZA: "남아프리카",
  CO: "콜롬비아",
  ZM: "잠비아",
  MK: "북마케도니아",
  AE: "아랍에미리트",
  SG: "싱가포르",
  HK: "홍콩",
  BR: "브라질",
  MX: "멕시코",
  IE: "아일랜드",
  BE: "벨기에",
  AT: "오스트리아",
  PL: "폴란드",
  PT: "포르투갈",
  IL: "이스라엘",
  TR: "터키",
  CL: "칠레",
  AR: "아르헨티나",
  GLOBAL: "글로벌",
};

const TEXT_COUNTRY_PATTERNS: { pattern: RegExp; code: string }[] = [
  { pattern: /\b(united states|u\.s\.|american|calpers|calstrs|nystrs|texas teachers|public pension fund)\b/i, code: "US" },
  { pattern: /\b(united kingdom|u\.k\.|british|england)\b/i, code: "GB" },
  { pattern: /\b(canada|canadian|cppib|ontario teachers|otpp|cdpq)\b/i, code: "CA" },
  { pattern: /\b(netherlands|dutch|apg|pggm)\b/i, code: "NL" },
  { pattern: /\b(nordic|norway|nbim|norges bank)\b/i, code: "NO" },
  { pattern: /\b(sweden|ap[1-4])\b/i, code: "SE" },
  { pattern: /\b(denmark)\b/i, code: "DK" },
  { pattern: /\b(australia|australian|australiansuper|australian super|superannuation)\b/i, code: "AU" },
  { pattern: /\b(new zealand|nz super|guardians of new zealand)\b/i, code: "NZ" },
  { pattern: /\b(japan|japanese|gpif|government pension investment fund)\b/i, code: "JP" },
  { pattern: /\b(korea|south korea|korean|국민연금|한국연금|공적연금|국민연금공단|국민연금기금)\b/i, code: "KR" },
  { pattern: /\b(national pension service|nps korea|korea national pension)\b/i, code: "KR" },
  { pattern: /\b(switzerland|swiss)\b/i, code: "CH" },
  { pattern: /\b(kenya|kenyan)\b/i, code: "KE" },
  { pattern: /\b(nigeria|nigerian)\b/i, code: "NG" },
  { pattern: /\b(spain|spanish)\b/i, code: "ES" },
  { pattern: /\b(colombia|colombian)\b/i, code: "CO" },
  { pattern: /\b(zambia|zambian)\b/i, code: "ZM" },
  { pattern: /\b(macedonia|kosovo)\b/i, code: "MK" },
  { pattern: /\b(germany|german)\b/i, code: "DE" },
  { pattern: /\b(france|french)\b/i, code: "FR" },
  { pattern: /\b(italy|italian)\b/i, code: "IT" },
  { pattern: /\b(abu dhabi|uae)\b/i, code: "AE" },
  { pattern: /\b(singapore|gic)\b/i, code: "SG" },
  { pattern: /\b(oecd|global pension)\b/i, code: "GLOBAL" },
];

export function countryCodeToFlag(code: string): string {
  const upper = code.toUpperCase();
  if (upper === "GLOBAL") return "🌐";
  if (!/^[A-Z]{2}$/.test(upper)) return "🌐";
  return String.fromCodePoint(
    ...upper.split("").map((c) => 0x1f1e6 - 65 + c.charCodeAt(0))
  );
}

export function getCountryNameKo(code: string): string {
  return COUNTRY_NAMES_KO[code.toUpperCase()] ?? code.toUpperCase();
}

export function inferCountryFromText(text: string): string | undefined {
  for (const { pattern, code } of TEXT_COUNTRY_PATTERNS) {
    if (pattern.test(text)) return code;
  }
  return undefined;
}

interface OpenAlexAuthorship {
  countries?: string[];
  institutions?: { country_code?: string }[];
}

export function extractCountryFromAuthorships(
  authorships: OpenAlexAuthorship[]
): string | undefined {
  const counts = new Map<string, number>();

  for (const authorship of authorships) {
    for (const code of authorship.countries ?? []) {
      if (code) counts.set(code, (counts.get(code) ?? 0) + 1);
    }
    for (const inst of authorship.institutions ?? []) {
      const code = inst.country_code;
      if (code) counts.set(code, (counts.get(code) ?? 0) + 1);
    }
  }

  if (counts.size === 0) return undefined;

  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

export function resolveCountryCode(paper: {
  countryCode?: string;
  title: string;
  abstract: string;
  journal: string;
}): string | undefined {
  if (paper.countryCode) return paper.countryCode;
  return inferCountryFromText(
    `${paper.title} ${paper.abstract} ${paper.journal}`
  );
}

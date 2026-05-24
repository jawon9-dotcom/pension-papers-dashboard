const SAA_PHRASES = [
  "strategic asset allocation",
  "strategic asset mix",
  "strategic portfolio allocation",
  "strategic allocation policy",
  "strategic asset policy",
  "policy portfolio",
  "policy asset allocation",
  "long-term asset allocation",
  "long-term allocation",
  "long run asset allocation",
  "long-run asset allocation",
  "target asset allocation",
  "strategic rebalancing",
  "asset mix policy",
  "portfolio policy benchmark",
  "전략적 자산배분",
  "전략적자산배분",
  "전략적 배분",
  "전략적자산 배분",
  "장기 자산배분",
  "장기자산배분",
  "정책 포트폴리오",
  "정책자산배분",
  "정책 자산배분",
  "allocation of assets in pension plans",
  "allocation of assets in pension",
];

const TAA_PHRASES = [
  "tactical asset allocation",
  "tactical asset mix",
  "tactical portfolio allocation",
  "tactical allocation policy",
  "dynamic tactical allocation",
  "tactical shift",
  "tactical positioning",
  "tactical rebalancing",
  "tactical overlay",
  "short-term asset allocation",
  "short-term allocation",
  "dynamic asset allocation",
  "regime-based allocation",
  "regime based allocation",
  "market timing",
  "portfolio tilt",
  "tactical tilt",
  "전술적 자산배분",
  "전술적자산배분",
  "전술적 배분",
  "전술적자산 배분",
  "단기 자산배분",
  "단기자산배분",
  "동적 자산배분",
];

const ALLOCATION_CONTEXT = [
  "asset",
  "allocation",
  "portfolio",
  "pension",
  "fund",
  "investment",
  "자산",
  "배분",
  "포트폴리오",
  "연기금",
  "투자",
];

function hasWord(text: string, word: string): boolean {
  return new RegExp(`\\b${word}\\b`, "i").test(text);
}

function hasAllocationContext(text: string): boolean {
  return ALLOCATION_CONTEXT.some((term) => text.includes(term));
}

function matchesPhrase(text: string, titleLower: string, phrase: string): boolean {
  return text.includes(phrase) || titleLower.includes(phrase);
}

function matchesStrategicAllocation(titleLower: string, text: string): boolean {
  return (
    (text.includes("strategic allocation") ||
      titleLower.includes("strategic allocation")) &&
    hasAllocationContext(text)
  );
}

function matchesTacticalAllocation(titleLower: string, text: string): boolean {
  return (
    (text.includes("tactical allocation") ||
      titleLower.includes("tactical allocation")) &&
    hasAllocationContext(text)
  );
}

function matchesPensionPlanAssetAllocation(
  titleLower: string,
  text: string
): boolean {
  const hasAllocationOfAssets =
    titleLower.includes("allocation of assets") ||
    text.includes("allocation of assets in pension") ||
    text.includes("allocation of assets in pension plans");
  const hasPensionPlanContext =
    titleLower.includes("pension plan") ||
    text.includes("pension plan") ||
    text.includes("pension fund");

  return (
    hasAllocationOfAssets &&
    hasPensionPlanContext &&
    hasAllocationContext(text)
  );
}

export function hasSaaSignal(title: string, text: string): boolean {
  const titleLower = title.toLowerCase();

  if (SAA_PHRASES.some((phrase) => matchesPhrase(text, titleLower, phrase))) {
    return true;
  }

  if (matchesPensionPlanAssetAllocation(titleLower, text)) return true;

  if (matchesStrategicAllocation(titleLower, text)) return true;

  if (
    (hasWord(text, "saa") || hasWord(titleLower, "saa")) &&
    hasAllocationContext(text)
  ) {
    return true;
  }

  if (
    (text.includes("investment policy statement") ||
      titleLower.includes("investment policy statement")) &&
    hasAllocationContext(text)
  ) {
    return true;
  }

  return false;
}

export function hasTaaSignal(title: string, text: string): boolean {
  const titleLower = title.toLowerCase();

  if (TAA_PHRASES.some((phrase) => matchesPhrase(text, titleLower, phrase))) {
    return true;
  }

  if (matchesTacticalAllocation(titleLower, text)) return true;

  if (
    (hasWord(text, "taa") || hasWord(titleLower, "taa")) &&
    hasAllocationContext(text)
  ) {
    return true;
  }

  if (
    (text.includes("overlay strategy") || titleLower.includes("overlay strategy")) &&
    hasAllocationContext(text)
  ) {
    return true;
  }

  return false;
}

export function resolveSaaTaaSubCategory(
  title: string,
  text: string
): "saa" | "taa" | null {
  const titleLower = title.toLowerCase();
  const saa = hasSaaSignal(title, text);
  const taa = hasTaaSignal(title, text);

  if (saa && !taa) return "saa";
  if (taa && !saa) return "taa";
  if (!saa || !taa) return null;

  const titleSaa =
    SAA_PHRASES.some((phrase) => titleLower.includes(phrase)) ||
    hasWord(titleLower, "saa") ||
    titleLower.includes("strategic allocation");
  const titleTaa =
    TAA_PHRASES.some((phrase) => titleLower.includes(phrase)) ||
    hasWord(titleLower, "taa") ||
    titleLower.includes("tactical allocation");

  if (titleTaa && !titleSaa) return "taa";
  if (titleSaa && !titleTaa) return "saa";
  if (titleLower.includes("tactical")) return "taa";
  if (titleLower.includes("strategic")) return "saa";
  if (titleLower.includes("전술")) return "taa";
  if (titleLower.includes("전략")) return "saa";

  return "saa";
}

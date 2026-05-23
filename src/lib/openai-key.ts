export const OPENAI_KEY_STORAGE = "pension-dashboard-openai-api-key";

export function normalizeOpenAiApiKey(key?: string | null): string | null {
  const trimmed = key?.trim();
  return trimmed ? trimmed : null;
}

export function isValidOpenAiKeyFormat(key: string): boolean {
  const normalized = normalizeOpenAiApiKey(key);
  return Boolean(normalized && /^sk-/.test(normalized) && normalized.length >= 20);
}

export function maskOpenAiKey(key: string): string {
  const normalized = normalizeOpenAiApiKey(key);
  if (!normalized) return "";
  if (normalized.length <= 12) return `${normalized.slice(0, 3)}...`;
  return `${normalized.slice(0, 7)}...${normalized.slice(-4)}`;
}

export function parseOpenAiError(
  status: number,
  bodyText: string
): { code: string; message: string } {
  try {
    const parsed = JSON.parse(bodyText) as {
      error?: { code?: string; message?: string };
    };
    const code = parsed.error?.code ?? "api_error";
    const message = parsed.error?.message ?? "OpenAI API 호출에 실패했습니다.";

    if (status === 401 || code === "invalid_api_key") {
      return {
        code: "invalid_api_key",
        message: "OpenAI API 키가 올바르지 않습니다. 키를 다시 확인해 주세요.",
      };
    }

    if (status === 429 || code === "insufficient_quota") {
      return {
        code: "insufficient_quota",
        message:
          "OpenAI 사용 한도가 부족합니다. Billing 페이지에서 크레딧/결제 수단을 확인해 주세요.",
      };
    }

    return { code, message };
  } catch {
    return {
      code: "api_error",
      message: "OpenAI API 호출에 실패했습니다. 잠시 후 다시 시도해 주세요.",
    };
  }
}

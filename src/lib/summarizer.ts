import { Paper } from "@/types/paper";
import {
  isValidOpenAiKeyFormat,
  normalizeOpenAiApiKey,
  parseOpenAiError,
} from "./openai-key";
import {
  readSummaryCache,
  writeSummaryCache,
} from "./cache";

export interface AiSummaryResult {
  titleKo: string;
  abstractKo: string;
  summaryKo: string;
  hasAiSummary: boolean;
  source: "openai" | "fallback" | "cache" | "error";
  errorCode?: string;
  errorMessage?: string;
}

export class SummarizeError extends Error {
  constructor(
    message: string,
    public code: string
  ) {
    super(message);
    this.name = "SummarizeError";
  }
}

function fallbackSummary(paper: Paper, message?: string): AiSummaryResult {
  const sentences = paper.abstract
    .split(/(?<=[.!?])\s+/)
    .filter((s) => s.length > 20)
    .slice(0, 3);

  return {
    titleKo: paper.title,
    abstractKo:
      paper.abstract === "Abstract not available for this paper."
        ? "초록 정보가 제공되지 않습니다."
        : paper.abstract,
    summaryKo:
      sentences.length > 0
        ? sentences.join(" ")
        : message ??
          "초록 정보가 부족하여 자동 요약을 생성할 수 없습니다.",
    hasAiSummary: false,
    source: "fallback",
  };
}

async function callOpenAI(
  paper: Paper,
  apiKey: string,
  model = "gpt-4o-mini"
): Promise<AiSummaryResult> {
  const prompt = `You are a financial research analyst specializing in global pension fund management.
Analyze the following academic paper and respond ONLY with valid JSON (no markdown fences).

Required JSON shape:
{
  "titleKo": "Korean translation of the title",
  "abstractKo": "Korean translation of the abstract (if no abstract, write a one-sentence note in Korean)",
  "summaryKo": "3-5 sentences in Korean summarizing key insights for pension fund practitioners"
}

Paper Title: ${paper.title}
Authors: ${paper.authors.join(", ")}
Journal: ${paper.journal} (${paper.year})
Abstract: ${paper.abstract}`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Respond only with valid JSON. Write all Korean fields in professional financial Korean.",
        },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!res.ok) {
    const bodyText = await res.text();
    const parsed = parseOpenAiError(res.status, bodyText);
    console.error("OpenAI API error:", res.status, parsed.code);
    throw new SummarizeError(parsed.message, parsed.code);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new SummarizeError(
      "OpenAI 응답을 해석하지 못했습니다.",
      "empty_response"
    );
  }

  try {
    const parsed = JSON.parse(content) as {
      titleKo?: string;
      abstractKo?: string;
      summaryKo?: string;
    };

    return {
      titleKo: parsed.titleKo || paper.title,
      abstractKo: parsed.abstractKo || paper.abstract,
      summaryKo:
        parsed.summaryKo ||
        "AI 요약을 생성하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      hasAiSummary: true,
      source: "openai",
    };
  } catch {
    throw new SummarizeError(
      "OpenAI 응답 JSON 파싱에 실패했습니다.",
      "invalid_response"
    );
  }
}

export async function generatePaperSummary(
  paper: Paper,
  options: { force?: boolean; apiKey?: string | null; model?: string } = {}
): Promise<AiSummaryResult> {
  const apiKey = normalizeOpenAiApiKey(options.apiKey);

  if (!apiKey) {
    return fallbackSummary(
      paper,
      "AI 한글 요약을 사용하려면 상단에서 OpenAI API 키를 입력해 주세요."
    );
  }

  if (!isValidOpenAiKeyFormat(apiKey)) {
    throw new SummarizeError(
      "OpenAI API 키 형식이 올바르지 않습니다.",
      "invalid_api_key"
    );
  }

  if (!options.force) {
    const cached = await readSummaryCache(paper.id);
    if (cached) {
      return { ...cached, hasAiSummary: true, source: "cache" };
    }
  }

  const model = options.model ?? process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  const result = await callOpenAI(paper, apiKey, model);

  if (result.source === "openai") {
    await writeSummaryCache(paper.id, {
      titleKo: result.titleKo,
      abstractKo: result.abstractKo,
      summaryKo: result.summaryKo,
    });
  }

  return result;
}

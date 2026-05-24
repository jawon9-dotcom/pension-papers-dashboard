import { Paper } from "@/types/paper";
import { readSummaryCache, writeSummaryCache } from "./cache";
import { isKoreanText, needsKoreanTitle } from "./title-ko";
import {
  isValidOpenAiKeyFormat,
  normalizeOpenAiApiKey,
  parseOpenAiError,
} from "./openai-key";

export interface TitleInput {
  id: string;
  title: string;
  titleKo?: string;
}

const BATCH_SIZE = 12;

async function translateTitleChunk(
  items: TitleInput[],
  apiKey: string,
  model: string
): Promise<Record<string, string>> {
  const prompt = `Translate each academic paper or news title into natural Korean for pension fund professionals.
Return ONLY valid JSON: an object whose keys are paper ids and values are Korean titles.

${JSON.stringify(
  items.map((item) => ({ id: item.id, title: item.title })),
  null,
  2
)}`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Respond only with valid JSON. Preserve proper nouns and acronyms (SAA, TAA, TPA, CalPERS, etc.) when appropriate.",
        },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!res.ok) {
    const bodyText = await res.text();
    const parsed = parseOpenAiError(res.status, bodyText);
    throw new Error(parsed.message);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) return {};

  const parsed = JSON.parse(content) as Record<string, string>;
  const results: Record<string, string> = {};

  for (const item of items) {
    const translated = parsed[item.id]?.trim();
    if (translated && isKoreanText(translated)) {
      results[item.id] = translated;
    }
  }

  return results;
}

export async function resolveTitleKoBatch(
  papers: TitleInput[],
  apiKey?: string | null
): Promise<Record<string, string>> {
  const results: Record<string, string> = {};
  const pending: TitleInput[] = [];

  for (const paper of papers) {
    if (!needsKoreanTitle(paper)) {
      if (paper.titleKo?.trim()) results[paper.id] = paper.titleKo.trim();
      continue;
    }

    const cached = await readSummaryCache(paper.id);
    if (cached?.titleKo && isKoreanText(cached.titleKo)) {
      results[paper.id] = cached.titleKo;
      continue;
    }

    pending.push(paper);
  }

  const normalizedKey = normalizeOpenAiApiKey(apiKey);
  if (pending.length === 0 || !normalizedKey || !isValidOpenAiKeyFormat(normalizedKey)) {
    return results;
  }

  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

  for (let index = 0; index < pending.length; index += BATCH_SIZE) {
    const chunk = pending.slice(index, index + BATCH_SIZE);
    const translated = await translateTitleChunk(chunk, normalizedKey, model);

    for (const [id, titleKo] of Object.entries(translated)) {
      results[id] = titleKo;
      const existing = await readSummaryCache(id);
      await writeSummaryCache(id, {
        titleKo,
        abstractKo: existing?.abstractKo ?? "",
        summaryKo: existing?.summaryKo ?? "",
      });
    }
  }

  return results;
}

export async function applyCachedTitles(papers: Paper[]): Promise<Paper[]> {
  return Promise.all(
    papers.map(async (paper) => {
      if (!needsKoreanTitle(paper)) return paper;

      const cached = await readSummaryCache(paper.id);
      if (cached?.titleKo && isKoreanText(cached.titleKo)) {
        return {
          ...paper,
          titleKo: cached.titleKo,
          abstractKo: paper.abstractKo || cached.abstractKo,
          summaryKo: paper.summaryKo || cached.summaryKo,
        };
      }

      return paper;
    })
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import {
  isValidOpenAiKeyFormat,
  maskOpenAiKey,
  normalizeOpenAiApiKey,
  OPENAI_KEY_STORAGE,
} from "@/lib/openai-key";

export function useOpenAiApiKey() {
  const [apiKey, setApiKeyState] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setApiKeyState(
      normalizeOpenAiApiKey(localStorage.getItem(OPENAI_KEY_STORAGE))
    );
    setReady(true);
  }, []);

  const saveApiKey = useCallback((value: string) => {
    const normalized = normalizeOpenAiApiKey(value);
    if (!normalized || !isValidOpenAiKeyFormat(normalized)) {
      return false;
    }

    localStorage.setItem(OPENAI_KEY_STORAGE, normalized);
    setApiKeyState(normalized);
    return true;
  }, []);

  const clearApiKey = useCallback(() => {
    localStorage.removeItem(OPENAI_KEY_STORAGE);
    setApiKeyState(null);
  }, []);

  return {
    apiKey,
    ready,
    hasApiKey: Boolean(apiKey),
    maskedKey: apiKey ? maskOpenAiKey(apiKey) : "",
    saveApiKey,
    clearApiKey,
  };
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { Paper } from "@/types/paper";
import {
  loadMyList,
  paperToSavedItem,
  saveMyList,
  SavedPaperItem,
} from "@/lib/my-list";

export function useMyList() {
  const [items, setItems] = useState<SavedPaperItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setItems(loadMyList());
    setReady(true);
  }, []);

  const persist = useCallback((nextItems: SavedPaperItem[]) => {
    setItems(nextItems);
    saveMyList(nextItems);
  }, []);

  const isSaved = useCallback(
    (id: string) => items.some((item) => item.id === id),
    [items]
  );

  const add = useCallback(
    (paper: Paper) => {
      if (items.some((item) => item.id === paper.id)) return;
      persist([paperToSavedItem(paper), ...items]);
    },
    [items, persist]
  );

  const remove = useCallback(
    (id: string) => {
      persist(items.filter((item) => item.id !== id));
    },
    [items, persist]
  );

  const toggle = useCallback(
    (paper: Paper) => {
      if (items.some((item) => item.id === paper.id)) {
        remove(paper.id);
        return;
      }
      add(paper);
    },
    [add, items, remove]
  );

  const clear = useCallback(() => {
    persist([]);
  }, [persist]);

  return {
    items,
    ready,
    count: items.length,
    isSaved,
    add,
    remove,
    toggle,
    clear,
  };
}

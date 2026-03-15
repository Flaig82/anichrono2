"use client";

import useSWR from "swr";
import { useAuth } from "./use-auth";
import type { QuestCategory, QuestWithProgress } from "@/types/quest";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useQuests(category?: QuestCategory) {
  const { user } = useAuth();

  const params = category ? `?category=${category}` : "";
  const { data, error, isLoading, mutate } = useSWR<QuestWithProgress[]>(
    user ? `/api/quest${params}` : null,
    fetcher,
  );

  return {
    quests: data ?? [],
    isLoading,
    error,
    mutate,
  };
}

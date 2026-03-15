import useSWR from "swr";
import type { PublicProfile } from "@/types/user";
import type { AuraType } from "@/types/aura";

interface AuraRow {
  aura_type: AuraType;
  value: number;
}

interface WatchStats {
  completed: number;
  watching: number;
  dropped: number;
  reviews: number;
}

interface ActivityItem {
  id: string;
  type: string;
  created_at: string;
  metadata: Record<string, unknown>;
  franchise: { title: string; slug: string } | null;
  entry: { title: string } | null;
}

interface PublicProfileResponse {
  profile: PublicProfile;
  aura: AuraRow[];
  stats: WatchStats;
  activity: ActivityItem[];
}

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("Failed to load profile");
    return r.json();
  });

export function usePublicProfile(handle: string | null) {
  const { data, error, isLoading } = useSWR<PublicProfileResponse>(
    handle ? `/api/user/${handle}` : null,
    fetcher,
  );

  return {
    profile: data?.profile ?? null,
    aura: data?.aura ?? [],
    stats: data?.stats ?? { completed: 0, watching: 0, dropped: 0, reviews: 0 },
    activity: data?.activity ?? [],
    isLoading,
    error,
  };
}

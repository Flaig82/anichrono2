import useSWR from "swr";

interface DiscussionAuthor {
  display_name: string;
  handle: string | null;
  avatar_url: string | null;
}

interface DiscussionItem {
  id: string;
  franchise_id: string;
  author_id: string;
  title: string;
  body: string;
  reply_count: number;
  last_reply_at: string | null;
  is_pinned: boolean;
  created_at: string;
  author: DiscussionAuthor | null;
}

interface DiscussionReply {
  id: string;
  discussion_id: string;
  author_id: string;
  body: string;
  created_at: string;
  author: DiscussionAuthor | null;
  like_count: number;
  user_liked: boolean;
}

interface DiscussionThread {
  discussion: DiscussionItem;
  replies: DiscussionReply[];
}

interface DiscussionListResponse {
  discussions: DiscussionItem[];
  total: number;
}

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("Failed to load");
    return r.json();
  });

export function useDiscussions(franchiseId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<DiscussionListResponse>(
    franchiseId ? `/api/franchise/${franchiseId}/discussions` : null,
    fetcher,
    { revalidateOnFocus: false },
  );

  return {
    discussions: data?.discussions ?? [],
    total: data?.total ?? 0,
    isLoading,
    error,
    mutate,
  };
}

export function useDiscussionThread(discussionId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<DiscussionThread>(
    discussionId ? `/api/discussion/${discussionId}` : null,
    fetcher,
    { revalidateOnFocus: false },
  );

  return {
    discussion: data?.discussion ?? null,
    replies: data?.replies ?? [],
    isLoading,
    error,
    mutate,
  };
}

export type { DiscussionItem, DiscussionReply, DiscussionAuthor };

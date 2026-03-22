"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export default function SearchInput({ defaultValue }: { defaultValue: string }) {
  const [query, setQuery] = useState(defaultValue);
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-3">
      <div className="flex flex-1 items-center gap-3 rounded-lg border border-[rgba(255,255,255,0.07)] bg-aura-bg2 px-4 py-3">
        <Search size={16} className="shrink-0 text-aura-muted" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search anime..."
          autoFocus
          className="flex-1 bg-transparent font-body text-sm tracking-[-0.28px] text-white placeholder:text-aura-muted outline-none"
        />
      </div>
      <button
        type="submit"
        className="rounded-lg bg-aura-orange px-5 py-3 font-body text-sm font-bold text-white transition-colors hover:bg-aura-orange-hover"
      >
        Search
      </button>
    </form>
  );
}

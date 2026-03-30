"use client";

import { ThumbsUp } from "lucide-react";

interface LikeButtonProps {
  liked: boolean;
  count: number;
  onClick: () => void;
}

export default function LikeButton({ liked, count, onClick }: LikeButtonProps) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="flex items-center gap-1.5 transition-colors"
      type="button"
    >
      {count > 0 && (
        <span
          className={`font-mono text-[11px] ${liked ? "text-aura-orange" : "text-aura-muted2"}`}
        >
          {count}
        </span>
      )}
      <div
        className={`flex h-6 w-6 items-center justify-center rounded-full transition-all ${
          liked
            ? "bg-[#eb6325] shadow-[0_4px_14px_rgba(255,131,74,0.48)]"
            : "bg-white/[0.08] hover:bg-white/[0.14]"
        }`}
      >
        <ThumbsUp
          size={12}
          className={liked ? "text-white" : "text-aura-muted2"}
        />
      </div>
    </button>
  );
}

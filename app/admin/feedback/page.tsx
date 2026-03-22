"use client";

import { useEffect, useState } from "react";
import { MessageSquare, Mail, Clock } from "lucide-react";

interface FeedbackItem {
  id: string;
  name: string;
  email: string;
  message: string;
  created_at: string;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function AdminFeedbackPage() {
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchFeedback() {
      const res = await fetch("/api/admin/feedback");
      if (res.ok) {
        setFeedback(await res.json());
      }
      setIsLoading(false);
    }
    fetchFeedback();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-[140px] animate-pulse rounded-xl bg-aura-bg3" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1
          className="font-brand text-xl font-bold tracking-tight text-white"
          style={{ textShadow: "0 0 12px rgba(235, 99, 37, 0.5)" }}
        >
          Feedback
        </h1>
        <p className="mt-1 font-body text-[13px] tracking-[-0.26px] text-aura-muted2">
          {feedback.length} submission{feedback.length !== 1 ? "s" : ""}
        </p>
      </div>

      {feedback.length === 0 ? (
        <div className="rounded-xl bg-aura-bg3 p-8 text-center">
          <MessageSquare size={24} className="mx-auto mb-3 text-aura-muted" />
          <p className="font-body text-sm text-aura-muted2">
            No feedback submissions yet.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {feedback.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-aura-border bg-aura-bg3 p-5"
            >
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-3">
                <span className="font-body text-[14px] font-bold tracking-[-0.28px] text-white">
                  {item.name}
                </span>
                <a
                  href={`mailto:${item.email}`}
                  className="flex items-center gap-1 font-mono text-[11px] tracking-wide text-aura-muted2 transition-colors hover:text-aura-orange"
                >
                  <Mail size={11} />
                  {item.email}
                </a>
                <span className="flex items-center gap-1 font-mono text-[11px] tracking-wide text-aura-muted">
                  <Clock size={11} />
                  {formatDate(item.created_at)}
                </span>
              </div>
              <p className="whitespace-pre-wrap font-body text-[13px] leading-relaxed tracking-[-0.26px] text-aura-muted2">
                {item.message}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

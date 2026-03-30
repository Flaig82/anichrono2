"use client";

import { useState } from "react";
import { MessageSquare, Plus, Loader2 } from "lucide-react";
import { useDiscussions } from "@/hooks/use-discussions";
import { useAuth } from "@/hooks/use-auth";
import DiscussionCard from "./DiscussionCard";
import DiscussionThread from "./DiscussionThread";
import CreateDiscussionDialog from "./CreateDiscussionDialog";
import AuthModal from "@/components/shared/AuthModal";

interface DiscussionListProps {
  franchiseId: string;
}

export default function DiscussionList({ franchiseId }: DiscussionListProps) {
  const { user } = useAuth();
  const { discussions, total, isLoading, mutate } =
    useDiscussions(franchiseId);
  const [selectedDiscussionId, setSelectedDiscussionId] = useState<
    string | null
  >(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  function handleStartDiscussion() {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    setShowCreateDialog(true);
  }

  function handleCreated(discussionId: string) {
    setShowCreateDialog(false);
    mutate();
    setSelectedDiscussionId(discussionId);
  }

  // Show thread view
  if (selectedDiscussionId) {
    return (
      <DiscussionThread
        discussionId={selectedDiscussionId}
        onBack={() => {
          setSelectedDiscussionId(null);
          mutate();
        }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare size={16} className="text-aura-muted2" />
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-aura-muted">
            Discussions ({total})
          </span>
        </div>
        <button
          onClick={handleStartDiscussion}
          className="flex items-center gap-2 rounded-lg bg-aura-orange px-4 py-2 font-body text-[13px] font-bold text-white transition-all hover:brightness-110"
        >
          <Plus size={14} />
          Start a Discussion
        </button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex flex-col items-center gap-2 py-12">
          <Loader2 size={16} className="animate-spin text-aura-muted" />
          <span className="font-body text-[11px] text-aura-muted">
            Loading discussions...
          </span>
        </div>
      ) : discussions.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl bg-aura-bg3 py-12">
          <MessageSquare size={24} className="text-aura-muted" />
          <p className="font-body text-[14px] font-bold text-white">
            No discussions yet
          </p>
          <p className="font-body text-[12px] text-aura-muted2">
            Be the first to start a discussion about this franchise.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {discussions.map((d) => (
            <DiscussionCard
              key={d.id}
              discussion={d}
              onClick={() => setSelectedDiscussionId(d.id)}
            />
          ))}
        </div>
      )}

      {showCreateDialog && (
        <CreateDiscussionDialog
          franchiseId={franchiseId}
          onClose={() => setShowCreateDialog(false)}
          onCreated={handleCreated}
        />
      )}

      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}
    </div>
  );
}

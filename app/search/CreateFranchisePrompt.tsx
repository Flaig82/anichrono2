"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import AddFranchiseDialog from "@/components/layout/AddFranchiseDialog";
import AuthModal from "@/components/shared/AuthModal";

/**
 * Shown in the search page's no-results state. Offers the same create-franchise
 * escape hatch as the Chronicles "Add a franchise" button, pre-filled with the
 * user's query. Logged-out users get the signup nudge instead of the dialog.
 */
export default function CreateFranchisePrompt({ query }: { query: string }) {
  const { user, isLoading } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        disabled={isLoading}
        onClick={() => (user ? setDialogOpen(true) : setAuthOpen(true))}
        className="flex w-fit items-center gap-1.5 rounded-full border-b border-aura-orange-hover bg-aura-orange px-5 py-3 font-body text-[15px] font-bold tracking-[-0.3px] text-white transition-colors hover:bg-aura-orange-hover disabled:opacity-50"
      >
        <Plus size={16} />
        Create franchise
      </button>

      <AddFranchiseDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        defaultQuery={query}
      />

      {authOpen && (
        <AuthModal context="create" onClose={() => setAuthOpen(false)} />
      )}
    </>
  );
}

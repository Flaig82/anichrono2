"use client";

import { Plus, X, Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface OrderEditorToolbarProps {
  onAddEntry: () => void;
  onCancel: () => void;
  onSubmit: () => void;
  hasChanges: boolean;
  entryCount: number;
}

export default function OrderEditorToolbar({
  onAddEntry,
  onCancel,
  onSubmit,
  hasChanges,
  entryCount,
}: OrderEditorToolbarProps) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-aura-orange/20 bg-aura-orange/5 p-3">
      <div className="flex items-center gap-2">
        <span className="font-body text-[11px] font-bold uppercase tracking-[0.15em] text-aura-orange">
          Editing Order
        </span>
        <span className="font-body text-[11px] text-aura-muted">
          {entryCount} entries
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onAddEntry}
          className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 font-body text-[12px] font-bold text-white transition-colors hover:bg-white/10"
        >
          <Plus size={14} />
          Add Entry
        </button>

        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 font-body text-[12px] font-bold text-aura-muted transition-colors hover:bg-white/10 hover:text-white"
        >
          <X size={14} />
          Cancel
        </button>

        <button
          onClick={onSubmit}
          disabled={!hasChanges}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-4 py-1.5 font-body text-[12px] font-bold transition-colors",
            hasChanges
              ? "bg-aura-orange text-white hover:bg-aura-orange-hover"
              : "cursor-not-allowed bg-white/5 text-aura-muted",
          )}
        >
          <Send size={14} />
          Submit Proposal
        </button>
      </div>
    </div>
  );
}

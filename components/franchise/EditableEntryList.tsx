"use client";

import { useState, useCallback, useRef } from "react";
import { Reorder } from "framer-motion";
import { Plus } from "lucide-react";
import type { EditorEntry } from "@/types/proposal";
import EditableEntryRow from "./EditableEntryRow";

interface EditableEntryListProps {
  entries: EditorEntry[];
  onReorder: (entries: EditorEntry[]) => void;
  onUpdate: (id: string, partial: Partial<EditorEntry>) => void;
  onDelete: (id: string) => void;
  onSplit: (id: string) => void;
  onInsertAt?: (index: number, data: RelationDropData) => void;
  onInsertBlankAt?: (index: number) => void;
}

export interface RelationDropData {
  anilist_id: number;
  title: string;
  entry_type: string;
  cover_image_url: string | null;
  episodes: number | null;
}

function InsertBetweenButton({
  index,
  onInsert,
}: {
  index: number;
  onInsert: (index: number) => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="relative flex h-2 items-center"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* Hover line */}
      {hovered && (
        <div className="absolute inset-x-2 top-1/2 h-px -translate-y-1/2 bg-aura-border2" />
      )}

      {/* Insert button */}
      {hovered && (
        <button
          onClick={() => onInsert(index)}
          className="absolute right-0 top-1/2 z-10 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md border border-aura-border2 bg-aura-bg3 text-aura-muted2 transition-colors hover:border-aura-orange/50 hover:bg-aura-orange/10 hover:text-aura-orange"
          title="Insert entry here"
        >
          <Plus size={12} />
        </button>
      )}
    </div>
  );
}

export default function EditableEntryList({
  entries,
  onReorder,
  onUpdate,
  onDelete,
  onSplit,
  onInsertAt,
  onInsertBlankAt,
}: EditableEntryListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);

  const calcDropIndex = useCallback(
    (clientY: number) => {
      const container = containerRef.current;
      if (!container) return 0;

      const items = container.querySelectorAll<HTMLElement>("[data-entry-idx]");
      for (let i = 0; i < items.length; i++) {
        const rect = items[i]!.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        if (clientY < midY) return i;
      }
      return entries.length;
    },
    [entries.length],
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      if (!e.dataTransfer.types.includes("application/aura-relation")) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
      setDropIndex(calcDropIndex(e.clientY));
    },
    [calcDropIndex],
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDropIndex(null);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const raw = e.dataTransfer.getData("application/aura-relation");
      const idx = dropIndex ?? calcDropIndex(e.clientY);
      setDropIndex(null);
      if (!raw || !onInsertAt) return;
      try {
        const data = JSON.parse(raw) as RelationDropData;
        onInsertAt(idx, data);
      } catch {
        // invalid data
      }
    },
    [dropIndex, calcDropIndex, onInsertAt],
  );

  return (
    <div
      ref={containerRef}
      onDragOver={onInsertAt ? handleDragOver : undefined}
      onDragLeave={onInsertAt ? handleDragLeave : undefined}
      onDrop={onInsertAt ? handleDrop : undefined}
    >
      <Reorder.Group
        axis="y"
        values={entries}
        onReorder={onReorder}
        className="flex flex-col"
      >
        {entries.map((entry, index) => (
          <Reorder.Item key={entry.id} value={entry} className="list-none">
            {/* Drop indicator line */}
            {dropIndex === index && (
              <div className="mx-2 mb-1 h-[3px] rounded-full bg-aura-orange shadow-[0_0_8px_rgba(249,115,22,0.5)]" />
            )}

            {/* Insert-between button (above this entry, i.e. between prev and this) */}
            {index > 0 && onInsertBlankAt && (
              <InsertBetweenButton index={index} onInsert={onInsertBlankAt} />
            )}

            <div data-entry-idx={index}>
              <EditableEntryRow
                entry={entry}
                position={index + 1}
                onUpdate={onUpdate}
                onDelete={onDelete}
                onSplit={onSplit}
              />
            </div>
          </Reorder.Item>
        ))}
      </Reorder.Group>

      {/* Drop indicator at end of list */}
      {dropIndex === entries.length && (
        <div className="mx-2 mt-1 h-[3px] rounded-full bg-aura-orange shadow-[0_0_8px_rgba(249,115,22,0.5)]" />
      )}
    </div>
  );
}

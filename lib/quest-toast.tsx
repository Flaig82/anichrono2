import { toast } from "sonner";
import { AURA_COLORS, AURA_LABELS, type AuraType } from "@/types/aura";

interface CompletedQuest {
  title: string;
  aura_type: string;
  aura_amount: number;
}

/** Show a toast for each completed quest in the response */
export function showQuestToasts(completedQuests?: CompletedQuest[]) {
  if (!completedQuests?.length) return;

  for (const quest of completedQuests) {
    const auraType = quest.aura_type as AuraType;
    const color = AURA_COLORS[auraType] ?? "#F97316";
    const label = AURA_LABELS[auraType] ?? quest.aura_type;

    toast.custom(() => (
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "14px 16px",
        background: "#1a1a1e",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: "12px",
        fontFamily: "var(--font-montserrat), sans-serif",
      }}>
        <div style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          backgroundColor: color,
          boxShadow: `0 0 8px ${color}60`,
          flexShrink: 0,
        }} />
        <div style={{ display: "flex", flexDirection: "column", gap: "2px", minWidth: 0 }}>
          <span style={{
            fontSize: "13px",
            fontWeight: 700,
            color: "#EEF0F6",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}>
            Quest Complete
          </span>
          <span style={{
            fontSize: "12px",
            color: "#8A94A8",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}>
            {quest.title}
          </span>
        </div>
        <span style={{
          marginLeft: "auto",
          fontFamily: "var(--font-lato), monospace",
          fontSize: "12px",
          fontWeight: 600,
          color,
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}>
          +{quest.aura_amount} {label}
        </span>
      </div>
    ), { duration: 5000 });
  }
}

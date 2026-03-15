export const AURA_TYPES = [
  "pioneer",
  "scholar",
  "oracle",
  "sensei",
  "aura",
  "archivist",
] as const;

export type AuraType = (typeof AURA_TYPES)[number];

export const AURA_COLORS: Record<AuraType, string> = {
  pioneer: "#3B82F6",
  scholar: "#8B5CF6",
  oracle: "#EC4899",
  sensei: "#F59E0B",
  aura: "#25EB7E",
  archivist: "#F97316",
};

export const AURA_LABELS: Record<AuraType, string> = {
  pioneer: "Pioneer",
  scholar: "Scholar",
  oracle: "Oracle",
  sensei: "Sensei",
  aura: "Aura",
  archivist: "Archivist",
};

export const ERA_LIST = [
  "initiate",
  "wanderer",
  "adept",
  "ascendant",
] as const;

export type Era = (typeof ERA_LIST)[number];

export const ERA_THRESHOLDS: Record<Era, { min: number; max: number }> = {
  initiate: { min: 0, max: 499 },
  wanderer: { min: 500, max: 2499 },
  adept: { min: 2500, max: 7499 },
  ascendant: { min: 7500, max: Infinity },
};

export const ERA_EMOJI: Record<Era, string> = {
  initiate: "🌱",
  wanderer: "🧭",
  adept: "⚔",
  ascendant: "👁",
};

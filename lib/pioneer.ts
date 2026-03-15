/** Pioneer Aura calculation based on franchise obscurity tier */

export const PIONEER_BASE = 100;

export const OBSCURITY_MULTIPLIERS: Record<string, number> = {
  mainstream: 0.5,
  popular: 1.0,
  cult: 2.0,
  obscure: 4.0,
};

/**
 * Returns the Pioneer Aura value for completing an entry in a franchise
 * with the given obscurity tier.
 */
export function getPioneerAura(tier: string | null): number {
  if (!tier) return PIONEER_BASE; // default 1x if unknown
  const multiplier = OBSCURITY_MULTIPLIERS[tier] ?? 1.0;
  return Math.round(PIONEER_BASE * multiplier);
}

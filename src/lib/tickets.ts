export type TierDef = { tier: "KVOTA_3" | "KVOTA_7" | "KVOTA_15" | "KVOTA_20_30"; min: number; max: number };

export const TIERS: TierDef[] = [
  { tier: "KVOTA_3", min: 2.5, max: 4 },
  { tier: "KVOTA_7", min: 6, max: 9 },
  { tier: "KVOTA_15", min: 12, max: 18 },
  { tier: "KVOTA_20_30", min: 20, max: 32 },
];

export type CandidateTip = {
  id: string;
  odds: number;
  confidence: number;
};

/**
 * Greedily combines tips (safest/highest-confidence first) into a parlay whose
 * combined odds land inside [min, max]. Returns null if no combination gets close.
 */
export function buildTicketForTarget(
  tips: CandidateTip[],
  min: number,
  max: number,
  maxLegs = 8,
): CandidateTip[] | null {
  const sorted = [...tips].sort((a, b) => b.confidence - a.confidence);
  const picked: CandidateTip[] = [];
  let combinedOdds = 1;

  for (const tip of sorted) {
    if (picked.length >= maxLegs) break;
    if (combinedOdds >= min) break;
    picked.push(tip);
    combinedOdds *= tip.odds;
  }

  if (combinedOdds < min * 0.7) return null; // nowhere close to target, not worth publishing
  if (combinedOdds > max * 1.5) return null; // overshot badly (unlikely given greedy ascent)

  return picked;
}

export function combinedOdds(tips: CandidateTip[]): number {
  return tips.reduce((acc, t) => acc * t.odds, 1);
}

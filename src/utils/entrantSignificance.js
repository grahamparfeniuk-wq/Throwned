import { isArenaDefender, isRisingContender } from "./creatorStats";
import { arenaItems, sortRank } from "./ranking";

/**
 * Subconscious hierarchy signal for entrance physics — no labels, tuning only.
 * Higher tier → slightly heavier arrival + stronger center reaction (restrained).
 */
export function computeEntrantSignificance({ entrant, pool, arena }) {
  const fallback = {
    tier: 0,
    score: 0,
    seamMul: 1,
    auraMul: 1,
    vsMul: 1,
    entrance: { mass: 0.74, stiffness: 208, damping: 31 },
  };

  if (!entrant || !pool || !arena) return fallback;

  const ranked = sortRank(arenaItems(pool, arena));
  let score = 0;

  if (entrant.rank != null) {
    if (entrant.rank <= 3) score += 3;
    else if (entrant.rank <= 10) score += 2;
    else if (entrant.rank <= 18) score += 0.6;
  }

  const aws = Math.max(0, Math.floor(entrant.arenaWinStreak ?? 0));
  if (aws >= 5) score += 2.4;
  else if (aws >= 3) score += 1.4;
  else if (aws >= 2) score += 0.75;

  const w = entrant.wins ?? 0;
  const l = entrant.losses ?? 0;
  const t = w + l;
  if (t >= 6 && w / Math.max(1, t) >= 0.72) score += 0.9;
  else if (t >= 4 && w / Math.max(1, t) >= 0.68) score += 0.45;

  const c = entrant.confidence ?? 0.52;
  if (c >= 0.84) score += 0.75;
  else if (c >= 0.72) score += 0.35;

  if (isRisingContender(ranked, arena, entrant)) score += 0.85;
  if (isArenaDefender(pool, arena, entrant)) score += 1.1;

  const tier = score >= 5.8 ? 4 : score >= 4.2 ? 3 : score >= 2.6 ? 2 : score >= 1.2 ? 1 : 0;
  const tNorm = Math.min(1, tier / 4);

  const seamMul = 0.94 + tNorm * 0.15;
  const auraMul = 0.96 + tNorm * 0.12;
  const vsMul = 0.985 + tNorm * 0.065;

  const mass = 0.74 + tNorm * 0.24;
  const stiffness = Math.round(208 - tNorm * 26);
  const damping = Math.round(31 + tNorm * 6);

  return {
    tier,
    score: Math.round(score * 10) / 10,
    seamMul,
    auraMul,
    vsMul,
    entrance: { mass, stiffness, damping },
  };
}

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
    entrance: { mass: 0.74, stiffness: 208, damping: 31, opacityDuration: 0.27 },
    settleMsApprox: 380,
  };

  if (!entrant || !pool || !arena) return fallback;

  const ranked = sortRank(arenaItems(pool, arena));
  let score = 0;

  if (entrant.rank != null) {
    if (entrant.rank <= 3) score += 3.6;
    else if (entrant.rank <= 10) score += 2.5;
    else if (entrant.rank <= 18) score += 0.65;
  }

  const aws = Math.max(0, Math.floor(entrant.arenaWinStreak ?? 0));
  if (aws >= 5) score += 2.8;
  else if (aws >= 3) score += 1.55;
  else if (aws >= 2) score += 0.8;

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

  const tier = score >= 5.5 ? 4 : score >= 3.9 ? 3 : score >= 2.4 ? 2 : score >= 1.1 ? 1 : 0;
  const tNorm = Math.min(1, tier / 4);

  /* Wider spread: low tier pulls atmosphere down; high tier loads seam / VS / arrival (still restrained). */
  const seamMul = 0.86 + tNorm * 0.3;
  const auraMul = 0.9 + tNorm * 0.26;
  const vsMul = 0.965 + tNorm * 0.14;

  const mass = 0.62 + tNorm * 0.48;
  const stiffness = Math.round(218 - tNorm * 48);
  const damping = Math.round(27 + tNorm * 18);
  const opacityDuration = Math.round((0.26 + tNorm * 0.16) * 1000) / 1000;

  const settleMsApprox = clampSettleMs(mass, stiffness, damping);

  return {
    tier,
    score: Math.round(score * 10) / 10,
    seamMul,
    auraMul,
    vsMul,
    entrance: { mass, stiffness, damping, opacityDuration },
    settleMsApprox,
  };
}

/** Dev-oriented heuristic: heavier / softer springs settle slower (ms). */
function clampSettleMs(mass, stiffness, damping) {
  const raw = Math.round(260 + mass * 110 + damping * 5.2 - stiffness * 0.42);
  return Math.max(300, Math.min(780, raw));
}

/**
 * Approximate instant when entrant motion crosses the seam plane (opacity lands + spring midpoint).
 * Used for DEV timing comparison with {@link BattleSlot} seam-impact callback.
 */
export function estimateSeamImpactMs(entrance) {
  if (!entrance || typeof entrance !== "object") return 420;
  const { mass = 0.74, stiffness = 208, damping = 31, opacityDuration = 0.27 } = entrance;
  const settle = clampSettleMs(mass, stiffness, damping);
  const opMs = opacityDuration * 1000;
  return Math.round(opMs + settle * 0.38);
}

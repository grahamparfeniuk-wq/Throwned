import { isArenaDefender } from "./creatorStats";
import { arenaItems, sortRank } from "./ranking";

/** Session wins in a row before forced rotation (anti-stagnation). */
export const BATTLE_ROTATION_STREAK = 5;

function postThrowPool(pool, updatedWinner, updatedLoser, arena) {
  return sortRank(
    arenaItems(
      pool.map((x) => {
        if (x.id === updatedWinner.id) return updatedWinner;
        if (x.id === updatedLoser.id) return updatedLoser;
        return x;
      }),
      arena
    )
  );
}

function crowdSplit(ca, cb) {
  return ca >= 0.42 && ca <= 0.58 && cb >= 0.42 && cb <= 0.58;
}

/** Deterministic pick — rare tiers stay stable per bout without feeling random. */
function pickWord(pool, seed) {
  const s = String(seed);
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h * 31 + s.charCodeAt(i)) >>> 0) % 1_000_000_007;
  return pool[h % pool.length];
}

/** Tier 1 — subtle consequence (past / completed on the fallen side). */
const PULSE_T1 = ["SHAKEN", "CRACKED", "WAVERED", "STUMBLED", "FADED"];

/** Tier 2 — hierarchy damage */
const PULSE_T2 = ["EXPOSED", "BROKEN", "PRESSURED", "UNSEATED", "DISRUPTED"];

/** Tier 3 — major upset / dethroning energy (still rare overall via routing) */
const PULSE_T3 = ["TOPPLED", "DETHRONED", "SHATTERED", "OVERTURNED", "COLLAPSED"];

/** Tier 4 — arena-level shock (very rare) */
const PULSE_T4 = ["AFTERSHOCK", "UPHEAVAL", "FRACTURED", "RECKONING"];

/**
 * One-word aftermath pulse for the **fallen** contender’s slot — not winner celebration.
 * Most throws return null (routine falloff).
 */
export function pickThrowPunctuation({
  pool,
  arena,
  upset,
  upsetIntensity,
  hierarchyTier,
  streakBreak,
  majorStreakBreak,
  updatedWinner,
  updatedLoser,
  pairFirstConfidence,
  pairSecondConfidence,
}) {
  const loser = updatedLoser;
  const rankedPool = postThrowPool(pool, updatedWinner, updatedLoser, arena);
  const seedBase = `${loser.id}:${arena.id}`;

  const loserRank = loser.rank;

  // Tier 4 — extreme rarity
  if (hierarchyTier === 2 && upset && upsetIntensity >= 0.74) {
    return pickWord(PULSE_T4, seedBase + ":t4");
  }
  if (majorStreakBreak && loserRank != null && loserRank <= 5 && upset) {
    return pickWord(PULSE_T4, seedBase + ":streakhi");
  }

  // Tier 3 — major disruption of the fallen (gated so high-intensity stays rare)
  if (hierarchyTier === 2 && (upset || streakBreak || majorStreakBreak)) {
    return pickWord(PULSE_T3, seedBase + ":t3");
  }
  if (hierarchyTier === 1 && upset && upsetIntensity >= 0.52) {
    return pickWord(PULSE_T3, seedBase + ":t10");
  }
  if (upset && upsetIntensity >= 0.72) return pickWord(PULSE_T3, seedBase + ":upmaj");

  // Tier 2 — meaningful damage
  if (majorStreakBreak) return pickWord(PULSE_T2, seedBase + ":longbrk");
  if (streakBreak) return pickWord(PULSE_T2, seedBase + ":brk");
  if (upset && upsetIntensity >= 0.52) return pickWord(PULSE_T2, seedBase + ":up");
  if (loserRank != null && loserRank <= 10) return pickWord(PULSE_T2, seedBase + ":rank");

  /** Former #1 in this arena loses — dethroning aftermath on the fallen */
  if (isArenaDefender(pool, arena, loser) && upset) {
    return pickWord(PULSE_T3, seedBase + ":dethrone");
  }

  // Tier 1 — light consequence
  if (upset) return pickWord(PULSE_T1, seedBase + ":upsm");
  if (crowdSplit(pairFirstConfidence ?? 0.55, pairSecondConfidence ?? 0.55)) {
    return pickWord(["SPLIT", "TIED", "RIVAL"], seedBase + ":split");
  }

  return null;
}

/** Rotation batch — arena residue; keep one weighty word, rare tone */
export function pickRotationRitual(arena) {
  const ROT = ["UPHEAVAL", "RECKONING", "FRACTURED", "SHIFT"];
  return pickWord(ROT, `rot:${arena?.id ?? "arena"}`);
}

/** Vacated-slot incoming heat — single word, arrival pressure (not celebration). */
export function pickChallengerHotPulse() {
  return pickWord(["PRESSURE", "THREAT", "EDGE"], "hot:rot");
}

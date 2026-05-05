import { isArenaDefender, isRisingContender } from "./creatorStats";
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

/**
 * One broadcast-style line for a high-signal throw (rare; most throws return null).
 * Rotation ritual is handled separately — do not call when session streak hits {@link BATTLE_ROTATION_STREAK}.
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
  const rankedPool = postThrowPool(pool, updatedWinner, updatedLoser, arena);
  const nextArenaWinStreak = updatedWinner.arenaWinStreak ?? 0;

  if (hierarchyTier === 2) return "UPSET SHAKES THE ARENA";
  if (hierarchyTier === 1) return "POWER SHIFT — RANKED SHEET";
  if (majorStreakBreak) return "STREAK BROKEN — LONG DEFENSE ENDS";
  if (upset && upsetIntensity >= 0.68) return "MAJOR UPSET — STANDINGS RIPPLE";
  if (streakBreak) return "STREAK BROKEN";
  if (nextArenaWinStreak >= 6) return `${nextArenaWinStreak} STRAIGHT — RARE AIR`;
  if (nextArenaWinStreak === 5) return "FIVE STRAIGHT — CHAMPIONSHIP PACE";
  if (nextArenaWinStreak === 4) return "DEFENDING STREAK — FOUR DEEP";

  const throneHeld = upset && isArenaDefender(rankedPool, arena, updatedWinner);
  if (throneHeld) return "DEFENDER STUMBLES — THRONE HELD";

  if (crowdSplit(pairFirstConfidence ?? 0.55, pairSecondConfidence ?? 0.55)) {
    return "FANS SPLIT — NO EASY READ";
  }

  if (arena?.id === "sports" && isRisingContender(rankedPool, arena, updatedWinner)) {
    return "RISING IN SPORTS — MOMENTUM BUILDING";
  }

  return null;
}

/** When session streak forces rotation — single consequential line (not a notification). */
export function pickRotationRitual(arena) {
  const id = arena?.id;
  if (id === "comedy") return "DEFENDING STRETCH COMPLETE — NEXT COMIC";
  if (id === "sports") return "CHAMPION ROTATES — FRESH HUNT";
  if (id === "songs") return "RUN FULFILLED — STAGE CLEARS";
  return "DEFENDING STRETCH COMPLETE — FRESH HUNT";
}

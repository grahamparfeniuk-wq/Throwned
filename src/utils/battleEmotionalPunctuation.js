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

  if (hierarchyTier === 2) return "Top-three upset — the sheet moves";
  if (hierarchyTier === 1) return "Ranked upset — hierarchy turns";
  if (majorStreakBreak) return "Long defense broken";
  if (upset && upsetIntensity >= 0.68) return "Major upset — standings ripple";
  if (streakBreak) return "Defending run snapped";
  if (nextArenaWinStreak >= 6) return `${nextArenaWinStreak} straight — rare air`;
  if (nextArenaWinStreak === 5) return "Five straight — championship pace";
  if (nextArenaWinStreak === 4) return "Four straight — tightening grip";

  const throneHeld = upset && isArenaDefender(rankedPool, arena, updatedWinner);
  if (throneHeld) return "Throne defended under pressure";

  if (crowdSplit(pairFirstConfidence ?? 0.55, pairSecondConfidence ?? 0.55)) {
    return "Split crowd — no easy read";
  }

  if (arena?.id === "sports" && isRisingContender(rankedPool, arena, updatedWinner)) {
    return "Rising in Sports — momentum building";
  }

  return null;
}

/** When session streak forces rotation — single consequential line (not a notification). */
export function pickRotationRitual(arena) {
  const id = arena?.id;
  if (id === "comedy") return "Stretch complete — next comic in";
  if (id === "sports") return "Defense cleared — champion rotates";
  if (id === "songs") return "Run fulfilled — stage clears";
  return "Defending stretch complete — fresh hunt";
}

import { ARENAS } from "../data/arenas";
import { arenaItems, sortRank } from "./ranking";

export function normalizeCreatorHandle(itemOrHandle) {
  const s = typeof itemOrHandle === "string" ? itemOrHandle : itemOrHandle?.creator;
  return (s || "").trim();
}

/** Distinct arenas this creator has at least one entry in */
export function arenaCountForCreator(pool, handle) {
  if (!handle) return 0;
  const ids = new Set();
  for (const m of pool) {
    if (normalizeCreatorHandle(m) === handle) ids.add(m.arenaId);
  }
  return ids.size;
}

/**
 * True if the creator has any clip ranked in the top `fraction` of its arena leaderboard.
 */
export function isTopCompetitorInAnyArena(pool, handle, fraction = 0.25) {
  if (!handle) return false;
  for (const arena of ARENAS) {
    const ranked = sortRank(arenaItems(pool, arena));
    const n = ranked.length;
    if (n === 0) continue;
    const cutoffRank = Math.max(1, Math.ceil(n * fraction));
    const theirs = ranked.filter((m) => normalizeCreatorHandle(m) === handle);
    if (!theirs.length) continue;
    const best = Math.min(...theirs.map((m) => m.rank));
    if (best <= cutoffRank) return true;
  }
  return false;
}

export function locationLine(item) {
  if (!item) return null;
  const parts = [item.hometown, item.country, item.locale].filter(Boolean);
  return parts.length ? parts.join(" · ") : null;
}

/** #1 in this arena’s leaderboard — defending the hill */
export function isArenaDefender(pool, arena, item) {
  if (!item) return false;
  const ranked = sortRank(arenaItems(pool, arena));
  return ranked.length > 0 && ranked[0].id === item.id;
}

/**
 * Threatening the top — not champion but in the upper tier of this arena (snapshot heuristic).
 */
export function isRisingContender(pool, arena, item) {
  if (!item || item.rank == null) return false;
  const ranked = sortRank(arenaItems(pool, arena));
  const n = ranked.length;
  if (n < 3) return false;
  if (item.rank <= 1) return false;
  const ceiling = Math.max(2, Math.min(n - 1, Math.ceil(n * 0.35)));
  return item.rank >= 2 && item.rank <= ceiling;
}

import {
  arenaCountForCreator,
  isArenaDefender,
  isRisingContender,
  isTopCompetitorInAnyArena,
  normalizeCreatorHandle,
} from "./creatorStats";
import { arenaItems, sortRank } from "./ranking";

function shortArenaLabel(arena) {
  if (!arena?.label) return "this arena";
  const words = arena.label.trim().split(/\s+/);
  const first = words[0];
  if (words.length === 1) return first;
  if (first.length <= 14) return first;
  return `${arena.label.slice(0, 12)}…`;
}

/**
 * Picks 1–2 broadcast-style narrative lines (strongest emotional signal first).
 * Copy is sports-adjacent, not gamified badge text.
 */
export function selectNarrativeLines({ item, pool, arena }) {
  if (!item || !pool || !arena) return [];

  const handle = normalizeCreatorHandle(item);
  const ranked = sortRank(arenaItems(pool, arena));
  const n = ranked.length;
  const wins = item.wins ?? 0;
  const losses = item.losses ?? 0;
  const total = wins + losses;
  const arenasEntered = arenaCountForCreator(pool, handle);
  const shortLabel = shortArenaLabel(arena);

  /** @type {{ w: number, text: string }[]} */
  const candidates = [];

  if (isArenaDefender(pool, arena, item)) {
    candidates.push({ w: 96, text: `Defending #1 in ${shortLabel}` });
  }

  if (wins > 0 && losses === 0) {
    candidates.push({ w: 90, text: `Undefeated in ${shortLabel}` });
  }

  if (total >= 6 && wins >= 5) {
    candidates.push({ w: 88, text: `Won ${wins} of the last ${total} on record` });
  } else if (total >= 4 && wins >= 3 && wins / total >= 0.75) {
    candidates.push({ w: 84, text: `Winning the nights that matter — ${wins}–${losses}` });
  }

  if (isTopCompetitorInAnyArena(pool, handle, 0.25) && !isArenaDefender(pool, arena, item)) {
    candidates.push({ w: 82, text: `Proven against top fields across the circuit` });
  }

  if (isRisingContender(pool, arena, item)) {
    candidates.push({ w: 80, text: `Closing on the title picture in ${shortLabel}` });
  }

  if (item.country) {
    candidates.push({ w: 76, text: `Rising in ${item.country}` });
  }

  if (item.localFavorite || item.localContender) {
    candidates.push({ w: 78, text: `Local favorite — hometown noise behind them` });
  } else if (item.hometown || item.locale) {
    candidates.push({ w: 72, text: `Carrying ${item.hometown || item.locale} into the arena` });
  }

  if (arenasEntered >= 3) {
    candidates.push({ w: 74, text: `Battle-tested across ${arenasEntered} competitions` });
  }

  if (item.uploaded && total <= 2) {
    candidates.push({ w: 68, text: `New walkout — still earning their story here` });
  }

  if (item.confidence != null && item.confidence >= 0.44 && item.confidence <= 0.56 && n >= 4) {
    candidates.push({ w: 64, text: `Crowd split — every round counts with this one` });
  }

  if (item.rank != null && n >= 6 && item.rank > 1 && item.rank <= Math.max(2, Math.ceil(n * 0.12))) {
    candidates.push({ w: 79, text: `Upside play — knocking on the elite door` });
  }

  candidates.sort((a, b) => b.w - a.w);

  const seen = new Set();
  const out = [];
  for (const c of candidates) {
    if (out.length >= 2) break;
    if (seen.has(c.text)) continue;
    seen.add(c.text);
    out.push(c.text);
  }

  return out;
}

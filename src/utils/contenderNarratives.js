import {
  arenaCountForCreator,
  isArenaDefender,
  isRisingContender,
  isTopCompetitorInAnyArena,
  normalizeCreatorHandle,
} from "./creatorStats";
import { topIdentitySignals } from "./contenderIdentity";
import { arenaItems, sortRank } from "./ranking";

/** Uppercase broadcast tag — one emotional anchor (intro graphic), not doctrine copy */
export function selectBroadcastEyebrow({ item, pool, arena }) {
  if (!item || !arena) return "CONTENDER";
  if (isArenaDefender(pool, arena, item)) return "DEFENDING";
  if (item.localFavorite || item.localContender) return "LOCAL FAVORITE";
  if (isRisingContender(pool, arena, item)) return "RISING";
  const wins = item.wins ?? 0;
  const losses = item.losses ?? 0;
  const total = wins + losses;
  if (total >= 3 && wins / Math.max(1, total) >= 0.78) return "FAST CLIMBER";
  if (item.country && String(item.country).trim()) {
    return String(item.country)
      .trim()
      .toUpperCase()
      .slice(0, 20);
  }
  if (item.hometown && String(item.hometown).trim()) {
    return String(item.hometown)
      .trim()
      .split(/[\s,]+/)[0]
      .toUpperCase()
      .slice(0, 14);
  }
  const first = arena.label?.trim().split(/\s+/)[0];
  if (first) return first.toUpperCase().slice(0, 16);
  return "CONTENDER";
}

/** Human momentum — avoids “Rating #### • Royalty” database tone */
export function momentumHumanPhrase(item) {
  const c = item.confidence ?? 0.55;
  if (c >= 0.86) return "Elite tier — trust is earned";
  if (c >= 0.73) return "Rising fast";
  if (c >= 0.58) return "Building steam";
  return "Outsider lane — proof over hype";
}

/** Single broadcast-style status line (where they stand) */
export function buildStatusSnapshot({ item, arena }) {
  if (!item || !arena) return "";
  const field = arena.label?.trim() || "this arena";
  const shortField = field.split(/\s+/).length > 3 ? `${field.split(/\s+/).slice(0, 2).join(" ")}…` : field;
  const rankPart = item.rank != null ? `#${item.rank} in ${shortField}` : "Still carving a lane";
  return `${rankPart} · ${momentumHumanPhrase(item)}`;
}

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
    candidates.push({ w: 96, text: `Defending the throne in ${shortLabel}` });
  }

  if (wins > 0 && losses === 0) {
    candidates.push({ w: 90, text: `Undefeated in ${shortLabel}` });
  }

  if (item.rank != null && item.rank <= 10) {
    candidates.push({ w: 89, text: `Holding Top ${item.rank} under pressure` });
  }

  if (total >= 6 && wins >= 5) {
    candidates.push({ w: 88, text: `Won ${wins} of the last ${total}` });
  } else if (total >= 4 && wins >= 3 && wins / total >= 0.75) {
    candidates.push({ w: 84, text: `On a heater — ${wins}–${losses} when it counts` });
  }

  if (isTopCompetitorInAnyArena(pool, handle, 0.25) && !isArenaDefender(pool, arena, item)) {
    candidates.push({ w: 82, text: `Has beaten top fields before — not a fluke name` });
  }

  if (isRisingContender(pool, arena, item)) {
    candidates.push({ w: 80, text: `Fast climber — hunting the title picture in ${shortLabel}` });
  }

  if (item.country) {
    candidates.push({ w: 76, text: `Rising in ${item.country}` });
  }

  if (item.localFavorite || item.localContender) {
    candidates.push({ w: 78, text: `Local favorite — this crowd rides with them` });
  } else if (item.hometown || item.locale) {
    candidates.push({ w: 72, text: `${item.hometown || item.locale} walks in with them` });
  }

  if (arenasEntered >= 3) {
    candidates.push({ w: 74, text: `Battle-tested across ${arenasEntered} wars` });
  }

  if (item.uploaded && total <= 2) {
    candidates.push({ w: 68, text: "New to the arena" });
  }

  if (item.confidence != null && item.confidence >= 0.44 && item.confidence <= 0.56 && n >= 4) {
    candidates.push({ w: 64, text: `Fans split — no easy read on this one` });
  }

  if (item.rank != null && n >= 6 && item.rank > 1 && item.rank <= Math.max(2, Math.ceil(n * 0.12))) {
    candidates.push({ w: 79, text: "Upset a Top 10 contender" });
  }

  const identitySignals = topIdentitySignals(item);
  if (identitySignals.length > 0) {
    candidates.push({ w: 67, text: identitySignals.slice(0, 2).join(" · ") });
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

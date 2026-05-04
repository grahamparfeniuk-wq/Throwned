import {
  arenaCountForCreator,
  isArenaDefender,
  isRisingContender,
  isTopCompetitorInAnyArena,
  isTopNRanked,
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

function narrativeRotationOffset(item, arena) {
  let h = 0;
  const s = `${item?.id ?? ""}:${arena?.id ?? ""}:${item?.wins ?? 0}:${item?.losses ?? 0}:${item?.rank ?? 0}`;
  for (let i = 0; i < s.length; i++) h = ((h * 31 + s.charCodeAt(i)) >>> 0) % 1_000_000_007;
  return h % 7;
}

function isLateNight() {
  const h = new Date().getHours();
  return h >= 23 || h < 5;
}

function backingCityLine(item) {
  const raw = (item.hometown || item.locale || "").trim();
  if (!raw) return null;
  const city = raw.split(/[·,]/)[0].trim();
  if (!city) return null;
  return `${city} backing this contender`;
}

function opponentSplitNarrative(item, opponent, poolSize) {
  if (!item || !opponent || poolSize < 4) return null;
  const ca = item.confidence ?? 0.55;
  const cb = opponent.confidence ?? 0.55;
  if (ca >= 0.42 && ca <= 0.58 && cb >= 0.42 && cb <= 0.58) {
    return "Fans split on this battle";
  }
  if (Math.abs((item.rating ?? 0) - (opponent.rating ?? 0)) < 45 && Math.abs(ca - cb) < 0.12) {
    return "Too close to call — split crowd energy";
  }
  return null;
}

function underdogPairingLine(item, opponent) {
  if (!item || !opponent) return null;
  if ((item.rating ?? 0) < (opponent.rating ?? 0) && isTopNRanked(opponent, 10)) {
    return "Outgunned on paper — still in the fight";
  }
  return null;
}

function pressureTop10Line(item, opponent) {
  if (!item || !opponent) return null;
  if (isTopNRanked(opponent, 10) && (item.rank ?? 99) > (opponent.rank ?? 0)) {
    return "Measured against a Top 10 sheet";
  }
  return null;
}

/**
 * Picks 1–2 broadcast-style narrative lines (strongest emotional signal first).
 * Optional `opponent` unlocks matchup-aware lines without extra UI.
 * Copy is sports-adjacent, not gamified badge text.
 */
export function selectNarrativeLines({ item, pool, arena, opponent } = {}) {
  if (!item || !pool || !arena) return [];

  const handle = normalizeCreatorHandle(item);
  const ranked = sortRank(arenaItems(pool, arena));
  const n = ranked.length;
  const wins = item.wins ?? 0;
  const losses = item.losses ?? 0;
  const total = wins + losses;
  const arenasEntered = arenaCountForCreator(pool, handle);
  const shortLabel = shortArenaLabel(arena);
  const arenaWinStreak = Math.max(0, Math.floor(item.arenaWinStreak ?? 0));

  /** @type {{ w: number, text: string }[]} */
  const candidates = [];

  if (arenaWinStreak >= 5) {
    candidates.push({ w: 97, text: `Defending streak: ${arenaWinStreak}` });
  } else if (arenaWinStreak >= 3) {
    candidates.push({ w: 93, text: `Defending streak: ${arenaWinStreak}` });
  } else if (arenaWinStreak >= 2) {
    candidates.push({ w: 88, text: `Heater: ${arenaWinStreak} straight in ${shortLabel}` });
  }

  if (isArenaDefender(pool, arena, item)) {
    candidates.push({ w: 96, text: `Holding the throne in ${shortLabel}` });
  }

  if (wins > 0 && losses === 0) {
    candidates.push({ w: 91, text: `Undefeated in ${shortLabel}` });
  }

  if (total >= 8 && wins >= 7) {
    candidates.push({ w: 94, text: `Won ${wins} of the last ${total}` });
  } else if (total >= 6 && wins >= 5) {
    candidates.push({ w: 90, text: `Won ${wins} of the last ${total}` });
  } else if (total >= 4 && wins >= 3 && wins / total >= 0.75) {
    candidates.push({ w: 85, text: `On a run — ${wins}–${losses} when it counts` });
  }

  if (item.rank != null && item.rank <= 10) {
    candidates.push({ w: 89, text: `Top ${item.rank} pressure — no easy outs` });
  }

  if (item.rank != null && n >= 6 && item.rank > 1 && item.rank <= Math.max(2, Math.ceil(n * 0.12))) {
    candidates.push({ w: 83, text: "Knocking on the title door" });
  }

  if (
    opponent &&
    isTopNRanked(opponent, 10) &&
    (item.rating ?? 0) < (opponent.rating ?? 0) &&
    wins > losses
  ) {
    candidates.push({ w: 87, text: "Upset favorite — took the measure of a ranked sheet" });
  }

  if (isTopCompetitorInAnyArena(pool, handle, 0.25) && !isArenaDefender(pool, arena, item)) {
    candidates.push({ w: 82, text: `Proven in deep fields — not a one-hit story` });
  }

  if (isRisingContender(pool, arena, item)) {
    candidates.push({ w: 81, text: `Fastest climber in ${shortLabel} right now` });
  }

  if (item.country) {
    candidates.push({ w: 77, text: `Rising in ${item.country}` });
  }

  const cityLine = backingCityLine(item);
  if (cityLine) {
    candidates.push({ w: 79, text: cityLine });
  } else if (item.localFavorite || item.localContender) {
    candidates.push({ w: 78, text: `Local favorite — this crowd rides with them` });
  } else if (item.hometown || item.locale) {
    candidates.push({ w: 72, text: `${(item.hometown || item.locale).split(/[·,]/)[0].trim()} walks in with them` });
  }

  if (arena.id === "sports" && item.rank != null && item.rank <= 5) {
    candidates.push({ w: 80, text: "Holding strong in Sports" });
  }

  if (arena.id === "comedy" && isRisingContender(pool, arena, item)) {
    candidates.push({ w: 74, text: "Timing sharp — comedy under bright lights" });
  }

  if (arena.id === "songs" && (item.confidence ?? 0) >= 0.72) {
    candidates.push({ w: 72, text: "Letting the moment breathe — control reads elite" });
  }

  if (arenasEntered >= 3) {
    candidates.push({ w: 74, text: `Battle-tested across ${arenasEntered} circuits` });
  }

  if (item.uploaded && total <= 2 && wins >= 1) {
    candidates.push({ w: 76, text: "New challenger — entering hot" });
  } else if (item.uploaded && total <= 2) {
    candidates.push({ w: 68, text: "New to the arena" });
  }

  if (isLateNight() && (item.localFavorite || item.localContender)) {
    candidates.push({ w: 73, text: "Late-night arena favorite" });
  }

  const split = opponentSplitNarrative(item, opponent, n);
  if (split) candidates.push({ w: 78, text: split });

  const underdog = underdogPairingLine(item, opponent);
  if (underdog) candidates.push({ w: 83, text: underdog });

  const pressure = pressureTop10Line(item, opponent);
  if (pressure) candidates.push({ w: 81, text: pressure });

  if (item.confidence != null && item.confidence >= 0.44 && item.confidence <= 0.56 && n >= 4 && !split) {
    candidates.push({ w: 64, text: "Fans split — no easy read on this one" });
  }

  const identitySignals = topIdentitySignals(item);
  if (identitySignals.length > 0) {
    candidates.push({ w: 66, text: identitySignals.slice(0, 2).join(" · ") });
  }

  candidates.sort((a, b) => b.w - a.w);

  const ordered = [];
  const seenText = new Set();
  for (const c of candidates) {
    if (seenText.has(c.text)) continue;
    seenText.add(c.text);
    ordered.push(c);
  }

  const rot = narrativeRotationOffset(item, arena);
  const window = ordered.slice(0, Math.min(ordered.length, 8));
  if (window.length <= 2) return window.map((c) => c.text);

  const r = rot % window.length;
  const rotated = [...window.slice(r), ...window.slice(0, r)];

  const out = [];
  const seen = new Set();
  for (const c of rotated) {
    if (out.length >= 2) break;
    if (seen.has(c.text)) continue;
    seen.add(c.text);
    out.push(c.text);
  }
  return out;
}

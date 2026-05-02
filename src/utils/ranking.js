import { ARENAS } from "../data/arenas";

export function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

export function confidenceLabel(c) {
  if (c >= 0.86) return "Royalty";
  if (c >= 0.73) return "Elite";
  if (c >= 0.58) return "Rising";
  return "Wildcard";
}

export function expectedScore(a, b) {
  return 1 / (1 + 10 ** ((b - a) / 400));
}

export function voteTrust(ms) {
  if (ms < 350) return 0.2;
  if (ms < 850) return 0.45;
  if (ms < 1500) return 0.7;
  return 1;
}

export function updateConfidence(current, strong) {
  return clamp(current + (strong ? 0.04 : 0.022), 0.35, 0.98);
}

export function scoreDelta(winner, loser, weight) {
  const k = 32;
  const expected = expectedScore(winner.rating, loser.rating);
  const wVol = 1.15 + (1 - winner.confidence) * 0.85;
  const lVol = 1.15 + (1 - loser.confidence) * 0.85;

  return {
    winnerDelta: Math.max(2, Math.round(k * (1 - expected) * weight * wVol)),
    loserDelta: Math.max(2, Math.round(k * (1 - expected) * weight * lVol)),
  };
}

export function arenaById(id) {
  return ARENAS.find((a) => a.id === id) || ARENAS[0];
}

export function arenaItems(pool, arena) {
  return pool.filter((m) => m.arenaId === arena.id && m.type === arena.type);
}

export function sortRank(items) {
  return items
    .slice()
    .sort((a, b) => {
      if (b.rating !== a.rating) return b.rating - a.rating;
      return b.confidence - a.confidence;
    })
    .map((x, i) => ({ ...x, rank: i + 1 }));
}

export function pickRandom(items, exclude = []) {
  const choices = items.filter((x) => !exclude.includes(x.id));
  if (!choices.length) return null;
  return choices[Math.floor(Math.random() * choices.length)];
}

export function pickPair(items, avoid = []) {
  const first = pickRandom(items, avoid);
  const second = pickRandom(items, [...avoid, first?.id]);

  if (first && second && first.id !== second.id) return { first, second };

  const fallbackFirst = items[0] || null;
  const fallbackSecond = items.find((x) => x.id !== fallbackFirst?.id) || null;
  return { first: fallbackFirst, second: fallbackSecond };
}

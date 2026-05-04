/**
 * Subtle per-arena rhythm and atmosphere — pacing, seam weight, intro restraint.
 * Not UI decoration; tuning constants only.
 */
const BASE = {
  pacingMultiplier: 1,
  transitionMs: 210,
  victoryPauseDeltaMs: 0,
  upsetExtraDeltaMs: 0,
  impactFlashOpacity: 0.34,
  seamEnergyMul: 1,
  introGlowMul: 1,
  arenaSwitchTransitionScale: 1,
};

const BY_ID = {
  comedy: {
    pacingMultiplier: 0.9,
    transitionMs: 188,
    victoryPauseDeltaMs: -14,
    upsetExtraDeltaMs: -8,
    impactFlashOpacity: 0.3,
    seamEnergyMul: 0.94,
    introGlowMul: 1.02,
    arenaSwitchTransitionScale: 0.92,
  },
  sports: {
    pacingMultiplier: 1.06,
    transitionMs: 232,
    victoryPauseDeltaMs: 22,
    upsetExtraDeltaMs: 14,
    impactFlashOpacity: 0.38,
    seamEnergyMul: 1.14,
    introGlowMul: 1.06,
    arenaSwitchTransitionScale: 1.05,
  },
  songs: {
    pacingMultiplier: 1.12,
    transitionMs: 248,
    victoryPauseDeltaMs: 32,
    upsetExtraDeltaMs: 8,
    impactFlashOpacity: 0.26,
    seamEnergyMul: 0.86,
    introGlowMul: 0.82,
    arenaSwitchTransitionScale: 1.08,
  },
  sunset: {
    pacingMultiplier: 1.08,
    transitionMs: 236,
    victoryPauseDeltaMs: 20,
    upsetExtraDeltaMs: 4,
    impactFlashOpacity: 0.27,
    seamEnergyMul: 0.88,
    introGlowMul: 0.84,
    arenaSwitchTransitionScale: 1.06,
  },
  kittens: {
    pacingMultiplier: 1.05,
    transitionMs: 228,
    victoryPauseDeltaMs: 16,
    upsetExtraDeltaMs: 4,
    impactFlashOpacity: 0.28,
    seamEnergyMul: 0.9,
    introGlowMul: 0.88,
    arenaSwitchTransitionScale: 1.04,
  },
};

export function getArenaBattleProfile(arena) {
  const id = arena?.id;
  const patch = (id && BY_ID[id]) || {};
  return { ...BASE, ...patch };
}

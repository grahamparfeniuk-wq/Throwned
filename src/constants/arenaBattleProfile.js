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
  persistentAuraMul: 1,
  arenaSwitchTransitionScale: 1,
};

const BY_ID = {
  comedy: {
    pacingMultiplier: 0.82,
    transitionMs: 168,
    victoryPauseDeltaMs: -28,
    upsetExtraDeltaMs: -14,
    impactFlashOpacity: 0.28,
    seamEnergyMul: 0.88,
    introGlowMul: 1.04,
    persistentAuraMul: 0.9,
    arenaSwitchTransitionScale: 0.88,
  },
  sports: {
    pacingMultiplier: 1.12,
    transitionMs: 258,
    victoryPauseDeltaMs: 44,
    upsetExtraDeltaMs: 26,
    impactFlashOpacity: 0.44,
    seamEnergyMul: 1.28,
    introGlowMul: 1.1,
    persistentAuraMul: 1.14,
    arenaSwitchTransitionScale: 1.1,
  },
  songs: {
    pacingMultiplier: 1.22,
    transitionMs: 276,
    victoryPauseDeltaMs: 52,
    upsetExtraDeltaMs: 12,
    impactFlashOpacity: 0.24,
    seamEnergyMul: 0.78,
    introGlowMul: 0.76,
    persistentAuraMul: 0.76,
    arenaSwitchTransitionScale: 1.12,
  },
  sunset: {
    pacingMultiplier: 1.14,
    transitionMs: 252,
    victoryPauseDeltaMs: 36,
    upsetExtraDeltaMs: 8,
    impactFlashOpacity: 0.25,
    seamEnergyMul: 0.82,
    introGlowMul: 0.78,
    persistentAuraMul: 0.82,
    arenaSwitchTransitionScale: 1.08,
  },
  kittens: {
    pacingMultiplier: 1.1,
    transitionMs: 240,
    victoryPauseDeltaMs: 28,
    upsetExtraDeltaMs: 8,
    impactFlashOpacity: 0.26,
    seamEnergyMul: 0.85,
    introGlowMul: 0.84,
    persistentAuraMul: 0.84,
    arenaSwitchTransitionScale: 1.06,
  },
};

export function getArenaBattleProfile(arena) {
  const id = arena?.id;
  const patch = (id && BY_ID[id]) || {};
  return { ...BASE, ...patch };
}

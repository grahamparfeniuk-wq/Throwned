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
    pacingMultiplier: 0.76,
    transitionMs: 152,
    victoryPauseDeltaMs: -40,
    upsetExtraDeltaMs: -22,
    impactFlashOpacity: 0.26,
    seamEnergyMul: 0.84,
    introGlowMul: 1.04,
    persistentAuraMul: 0.96,
    arenaSwitchTransitionScale: 0.86,
  },
  sports: {
    pacingMultiplier: 1.2,
    transitionMs: 278,
    victoryPauseDeltaMs: 58,
    upsetExtraDeltaMs: 38,
    impactFlashOpacity: 0.5,
    seamEnergyMul: 1.38,
    introGlowMul: 1.12,
    persistentAuraMul: 1.24,
    arenaSwitchTransitionScale: 1.12,
  },
  songs: {
    pacingMultiplier: 1.3,
    transitionMs: 300,
    victoryPauseDeltaMs: 68,
    upsetExtraDeltaMs: 20,
    impactFlashOpacity: 0.22,
    seamEnergyMul: 0.7,
    introGlowMul: 0.76,
    persistentAuraMul: 0.86,
    arenaSwitchTransitionScale: 1.14,
  },
  sunset: {
    pacingMultiplier: 1.18,
    transitionMs: 264,
    victoryPauseDeltaMs: 44,
    upsetExtraDeltaMs: 12,
    impactFlashOpacity: 0.24,
    seamEnergyMul: 0.78,
    introGlowMul: 0.78,
    persistentAuraMul: 0.88,
    arenaSwitchTransitionScale: 1.1,
  },
  kittens: {
    pacingMultiplier: 1.12,
    transitionMs: 248,
    victoryPauseDeltaMs: 34,
    upsetExtraDeltaMs: 10,
    impactFlashOpacity: 0.26,
    seamEnergyMul: 0.82,
    introGlowMul: 0.84,
    persistentAuraMul: 0.9,
    arenaSwitchTransitionScale: 1.08,
  },
};

export function getArenaBattleProfile(arena) {
  const id = arena?.id;
  const patch = (id && BY_ID[id]) || {};
  return { ...BASE, ...patch };
}

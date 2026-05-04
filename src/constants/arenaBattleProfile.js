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
    pacingMultiplier: 0.7,
    transitionMs: 138,
    victoryPauseDeltaMs: -48,
    upsetExtraDeltaMs: -28,
    impactFlashOpacity: 0.24,
    seamEnergyMul: 0.8,
    introGlowMul: 1.04,
    persistentAuraMul: 0.98,
    arenaSwitchTransitionScale: 0.84,
  },
  sports: {
    pacingMultiplier: 1.28,
    transitionMs: 296,
    victoryPauseDeltaMs: 66,
    upsetExtraDeltaMs: 46,
    impactFlashOpacity: 0.54,
    seamEnergyMul: 1.48,
    introGlowMul: 1.14,
    persistentAuraMul: 1.32,
    arenaSwitchTransitionScale: 1.14,
  },
  songs: {
    pacingMultiplier: 1.38,
    transitionMs: 318,
    victoryPauseDeltaMs: 80,
    upsetExtraDeltaMs: 24,
    impactFlashOpacity: 0.2,
    seamEnergyMul: 0.62,
    introGlowMul: 0.76,
    persistentAuraMul: 0.92,
    arenaSwitchTransitionScale: 1.16,
  },
  sunset: {
    pacingMultiplier: 1.22,
    transitionMs: 272,
    victoryPauseDeltaMs: 50,
    upsetExtraDeltaMs: 14,
    impactFlashOpacity: 0.22,
    seamEnergyMul: 0.74,
    introGlowMul: 0.78,
    persistentAuraMul: 0.92,
    arenaSwitchTransitionScale: 1.12,
  },
  kittens: {
    pacingMultiplier: 1.16,
    transitionMs: 256,
    victoryPauseDeltaMs: 38,
    upsetExtraDeltaMs: 12,
    impactFlashOpacity: 0.25,
    seamEnergyMul: 0.78,
    introGlowMul: 0.84,
    persistentAuraMul: 0.94,
    arenaSwitchTransitionScale: 1.1,
  },
};

export function getArenaBattleProfile(arena) {
  const id = arena?.id;
  const patch = (id && BY_ID[id]) || {};
  return { ...BASE, ...patch };
}

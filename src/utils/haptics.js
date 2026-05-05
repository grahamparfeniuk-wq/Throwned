/** Throw consequence — minimal tap; distinct from entrance hierarchy haptics. */
export function vibrateThrow() {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  try {
    navigator.vibrate(5);
  } catch {
    /* ignored */
  }
}

/**
 * Vibration pattern for seam settle / collision (ms on, off, on, …).
 * Tier from {@link computeEntrantSignificance}: 0 = none, 4 = strongest restrained quake.
 */
export function getEntranceVibrationPattern(tier) {
  const t = Math.min(4, Math.max(0, Math.floor(tier ?? 0)));
  const patterns = [
    [],
    [9],
    [12, 14, 11],
    [16, 12, 18, 14],
    [22, 28, 26, 22, 24],
  ];
  return patterns[t] ?? [];
}

/**
 * Hierarchy-weighted seam arrival — fires at seam settle only (caller timing).
 * Tier 0: silent; higher tiers = slightly longer, lower-frequency pressure (still restrained).
 */
export function vibrateEntranceArrival(tier) {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  const pattern = getEntranceVibrationPattern(tier);
  if (!pattern.length) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    /* ignored */
  }
}

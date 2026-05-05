/** Subtle feedback on successful throw; no-op if unsupported. */
export function vibrateThrow() {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  try {
    navigator.vibrate(15);
  } catch {
    /* ignored */
  }
}

/**
 * Hierarchy-weighted seam arrival — tier from {@link computeEntrantSignificance}.
 * No-op when unsupported; desktop silent.
 */
export function vibrateEntranceArrival(tier) {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  const t = Math.min(4, Math.max(0, Math.floor(tier ?? 0)));
  const patterns = [[], [10], [16], [22, 16, 18], [30, 20, 26]];
  const pattern = patterns[t];
  if (!pattern?.length) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    /* ignored */
  }
}

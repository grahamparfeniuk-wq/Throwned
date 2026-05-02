/** Subtle feedback on successful throw; no-op if unsupported. */
export function vibrateThrow() {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  try {
    navigator.vibrate(15);
  } catch {
    /* ignored */
  }
}

import { AnimatePresence, motion } from "framer-motion";

/**
 * Broadcast aftermath copy — lives inside a BattleSlot, z-behind media (arena wake, not HUD).
 */
export function BattleAftermathLine({ text, token, accent, portrait, seamSide, styles }) {
  const show = Boolean(text?.trim());
  const wrapStyle =
    portrait && seamSide === "towardSeamBottom"
      ? styles.aftermathSlotWrapPortraitTowardBottom
      : portrait && seamSide === "towardSeamTop"
        ? styles.aftermathSlotWrapPortraitTowardTop
        : !portrait && seamSide === "towardSeamRight"
          ? styles.aftermathSlotWrapLandscapeTowardRight
          : styles.aftermathSlotWrapLandscapeTowardLeft;

  return (
    <div style={wrapStyle} aria-live="polite" aria-atomic="true">
      <AnimatePresence mode="wait">
        {show ? (
          <motion.div
            key={token}
            role="status"
            initial={{ opacity: 0, y: portrait ? (seamSide === "towardSeamBottom" ? 8 : -8) : seamSide === "towardSeamRight" ? -8 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            style={{
              ...styles.aftermathLineText,
              textShadow: `0 1px 28px rgba(0,0,0,.65), 0 0 20px ${accent}18`,
            }}
          >
            {text}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

/** Seam-adjacent neutral anchor for rotation ritual only — low z, behind contenders layout slots. */
export function BattleAftermathCenterLine({ text, token, accent, portrait, styles }) {
  const show = Boolean(text?.trim());
  const region = portrait ? styles.aftermathCenterPortrait : styles.aftermathCenterLandscape;

  return (
    <div style={styles.aftermathCenterMount} aria-live="polite">
      <AnimatePresence mode="wait">
        {show ? (
          <motion.div
            key={token}
            role="status"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            style={{
              ...region,
            }}
          >
            <span
              style={{
                ...styles.aftermathLineText,
                ...styles.aftermathCenterText,
                textShadow: `0 1px 28px rgba(0,0,0,.7), 0 0 22px ${accent}14`,
              }}
            >
              {text}
            </span>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

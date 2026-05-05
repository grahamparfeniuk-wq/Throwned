import { AnimatePresence, motion } from "framer-motion";

/** Transient center-weighted broadcast line — z above VS, no HUD chrome */
export function BattleAtmospherePunctuation({ text, token, accent, styles }) {
  const show = Boolean(text?.trim());

  return (
    <div style={styles.battlePunctuationMount} aria-live="polite" aria-atomic="true">
      <AnimatePresence mode="wait">
        {show ? (
          <motion.div
            key={token}
            role="status"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            style={{
              ...styles.battlePunctuationText,
              textShadow: `0 1px 24px rgba(0,0,0,.55), 0 0 18px ${accent}22`,
            }}
          >
            {text}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

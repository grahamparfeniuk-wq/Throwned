import { motion } from "framer-motion";

const GESTURES = [
  { label: "Tap", detail: "Choose the moment." },
  { label: "Swipe outward", detail: "Throw away the loser." },
  { label: "Swipe inward", detail: "Change arenas." },
  { label: "Long press", detail: "Enter contender mode." },
  { label: "Swipe up", detail: "Reveal standings." },
];

export function GestureOnboarding({ styles, onBegin }) {
  return (
    <motion.div
      style={styles.onboardingWrap}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div style={styles.onboardingBackdrop} />

      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Throned first run briefing"
        style={styles.onboardingCard}
        initial={{ opacity: 0, y: 10, scale: 0.982 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.987 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <div style={styles.onboardingEyebrow}>THRONED</div>
        <h1 style={styles.onboardingTitle}>Enter the Arena</h1>
        <p style={styles.onboardingSubcopy}>Every battle shapes the hierarchy.</p>

        <div style={styles.onboardingRule} />

        <div style={styles.onboardingGestureList}>
          {GESTURES.map((entry) => (
            <div key={entry.label} style={styles.onboardingGestureRow}>
              <div style={styles.onboardingGestureLabel}>{entry.label}</div>
              <div style={styles.onboardingGestureDetail}>{entry.detail}</div>
            </div>
          ))}
        </div>

        <button type="button" style={styles.onboardingBeginButton} onClick={onBegin}>
          BEGIN
        </button>
      </motion.div>
    </motion.div>
  );
}


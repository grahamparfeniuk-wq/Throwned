import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ARENA_INTRO_ENTER_EASE,
  ARENA_INTRO_ENTER_S,
  ARENA_INTRO_EXIT_EASE,
  ARENA_INTRO_EXIT_S,
} from "../../constants/arenaIntroMotion";

const ARENA_SEAL_TAP_HINT_KEY = "throwned:arena-seal-tap-hint";

function readTapHintDismissed() {
  try {
    return typeof localStorage !== "undefined" && localStorage.getItem(ARENA_SEAL_TAP_HINT_KEY) === "1";
  } catch {
    return true;
  }
}

export function ArenaLabel({ arena, visible, styles, onClick }) {
  const [tapHintDismissed, setTapHintDismissed] = useState(readTapHintDismissed);

  function dismissTapHint() {
    setTapHintDismissed(true);
    try {
      localStorage.setItem(ARENA_SEAL_TAP_HINT_KEY, "1");
    } catch {
      /* ignore */
    }
  }

  function handleActivate() {
    if (onClick) dismissTapHint();
    onClick?.();
  }

  const showTapHint = onClick && !tapHintDismissed;

  return (
    <AnimatePresence mode="wait">
      {visible && (
        <motion.div
          style={styles.arenaLabelWrap}
          initial={{ opacity: 0, scale: 0.97, y: 0 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{
            opacity: 0,
            scale: 0.99,
            y: 0,
            transition: { duration: ARENA_INTRO_EXIT_S, ease: ARENA_INTRO_EXIT_EASE },
          }}
          transition={{
            opacity: { duration: ARENA_INTRO_ENTER_S, ease: ARENA_INTRO_ENTER_EASE },
            scale: { duration: 0.52, ease: [0.18, 1, 0.32, 1] },
            y: { duration: 0 },
          }}
        >
          <div style={styles.arenaLabelStack}>
            <div
              role={onClick ? "button" : undefined}
              tabIndex={onClick ? 0 : undefined}
              aria-label={onClick ? `Choose arena. Current: ${arena.label}` : undefined}
              onClick={(e) => {
                e.stopPropagation();
                handleActivate();
              }}
              onKeyDown={(e) => {
                if (!onClick) return;
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  e.stopPropagation();
                  handleActivate();
                }
              }}
              style={{
                ...styles.arenaLabel,
                background: [
                  "linear-gradient(128deg, rgba(255,255,255,.082) 0%, transparent 54%)",
                  "linear-gradient(308deg, rgba(0,0,0,.22) 0%, transparent 56%)",
                  `linear-gradient(180deg, transparent calc(50% - 0.5px), ${arena.accent}52 50%, transparent calc(50% + 0.5px))`,
                  "linear-gradient(180deg, rgba(10,12,18,.74) 0%, rgba(7,8,13,.84) 48%, rgba(5,6,10,.88) 100%)",
                ].join(", "),
                pointerEvents: onClick ? "auto" : "none",
                cursor: onClick ? "pointer" : "default",
                boxShadow: [
                  "0 2px 11px rgba(0,0,0,.34)",
                  "0 5px 18px rgba(0,0,0,.2)",
                  "inset 0 1px 0 rgba(255,255,255,.065)",
                  "inset 0 -1px 0 rgba(0,0,0,.44)",
                  `inset 0 0 0 1px rgba(255,255,255,.028)`,
                  `0 0 1px ${arena.accent}42`,
                  `0 0 14px ${arena.accent}22`,
                ].join(", "),
              }}
            >
              <span
                style={{
                  ...styles.arenaLabelTitle,
                  color: arena.accent,
                }}
              >
                {arena.label}
              </span>
              {onClick ? (
                <span
                  style={{ ...styles.arenaLabelChevron, color: arena.accent }}
                  aria-hidden
                >
                  ▾
                </span>
              ) : null}
            </div>
            {showTapHint ? <div style={styles.arenaLabelHint}>Tap for arenas</div> : null}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

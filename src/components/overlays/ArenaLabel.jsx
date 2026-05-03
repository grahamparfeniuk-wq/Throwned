import { AnimatePresence, motion } from "framer-motion";
import {
  ARENA_INTRO_ENTER_EASE,
  ARENA_INTRO_ENTER_S,
  ARENA_INTRO_EXIT_EASE,
  ARENA_INTRO_EXIT_S,
} from "../../constants/arenaIntroMotion";

export function ArenaLabel({ arena, visible, styles, onClick }) {
  return (
    <AnimatePresence mode="wait">
      {visible && (
        <motion.div
          style={styles.arenaLabelWrap}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{
            opacity: 0,
            scale: 0.99,
            transition: { duration: ARENA_INTRO_EXIT_S, ease: ARENA_INTRO_EXIT_EASE },
          }}
          transition={{
            opacity: { duration: ARENA_INTRO_ENTER_S, ease: ARENA_INTRO_ENTER_EASE },
            scale: { duration: 0.52, ease: [0.18, 1, 0.32, 1] },
          }}
        >
          <div
            role={onClick ? "button" : undefined}
            tabIndex={onClick ? 0 : undefined}
            onClick={(e) => {
              e.stopPropagation();
              onClick?.();
            }}
            onKeyDown={(e) => {
              if (!onClick) return;
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
                onClick();
              }
            }}
            style={{
              ...styles.arenaLabel,
              background: [
                `linear-gradient(180deg, transparent calc(50% - 0.5px), ${arena.accent}45 50%, transparent calc(50% + 0.5px))`,
                "linear-gradient(180deg, rgba(10,12,18,.72) 0%, rgba(7,8,13,.82) 48%, rgba(5,6,10,.86) 100%)",
              ].join(", "),
              pointerEvents: onClick ? "auto" : "none",
              cursor: onClick ? "pointer" : "default",
              boxShadow: [
                "0 2px 14px rgba(0,0,0,.34)",
                "0 8px 28px rgba(0,0,0,.22)",
                "inset 0 1px 0 rgba(255,255,255,.07)",
                "inset 0 -1px 0 rgba(0,0,0,.45)",
                `0 0 1px ${arena.accent}44`,
                `0 0 20px ${arena.accent}22`,
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
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

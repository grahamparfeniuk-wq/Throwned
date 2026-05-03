import { AnimatePresence, motion } from "framer-motion";

export function ArenaLabel({ arena, visible, styles, onClick }) {
  return (
    <AnimatePresence mode="wait">
      {visible && (
        <motion.div
          style={styles.arenaLabelWrap}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{
            opacity: 0,
            transition: { duration: 0.62, ease: [0.38, 0, 0.22, 1] },
          }}
          transition={{
            opacity: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
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

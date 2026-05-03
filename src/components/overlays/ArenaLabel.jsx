import { AnimatePresence, motion } from "framer-motion";

export function ArenaLabel({ arena, visible, styles, onClick }) {
  return (
    <AnimatePresence mode="wait">
      {visible && (
        <motion.div
          style={styles.arenaLabelWrap}
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{
            opacity: 0,
            scale: 0.97,
            transition: { opacity: { duration: 0.62, ease: [0.4, 0, 0.2, 1] }, scale: { duration: 0.52 } },
          }}
          transition={{
            opacity: { duration: 0.42, ease: [0.22, 1, 0.36, 1] },
            scale: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
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
            style={{ ...styles.arenaLabel, borderColor: `${arena.accent}44`, pointerEvents: onClick ? "auto" : "none", cursor: onClick ? "pointer" : "default" }}
          >
            <span style={{ color: arena.accent }}>{arena.label}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

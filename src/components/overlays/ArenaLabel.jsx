import { AnimatePresence, motion } from "framer-motion";

export function ArenaLabel({ arena, visible, styles, onClick }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          style={styles.arenaLabelWrap}
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.32 }}
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

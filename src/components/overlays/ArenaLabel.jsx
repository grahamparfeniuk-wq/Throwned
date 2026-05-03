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
              borderBottom: `2px solid ${arena.accent}55`,
              boxShadow: `0 10px 36px rgba(0,0,0,.42), inset 0 1px 0 rgba(255,255,255,.05)`,
            }}
          >
            <span style={{ ...styles.arenaLabelTitle, color: arena.accent }}>{arena.label}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

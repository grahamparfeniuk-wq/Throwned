import { AnimatePresence, motion } from "framer-motion";

export function ArenaLabel({ arena, visible, styles }) {
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
          <div style={{ ...styles.arenaLabel, borderColor: `${arena.accent}44` }}>
            <span style={{ color: arena.accent }}>{arena.label}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

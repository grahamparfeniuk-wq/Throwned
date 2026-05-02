import { AnimatePresence, motion } from "framer-motion";

export function ChampionBanner({ item, accent, styles }) {
  if (!item) return null;

  return (
    <AnimatePresence>
      <motion.div style={styles.championWrap} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <motion.div style={{ ...styles.championCard, borderColor: `${accent}55` }} initial={{ opacity: 0, y: 12, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}>
          <div style={styles.championMicro}>3X DEFENDER</div>
          <div style={styles.championTitle}>{item.title}</div>
          <div style={styles.championCreator}>{item.creator}</div>
          <div style={styles.championRule} />
          <div style={styles.championSub}>Crowned, then cleared for fresh contenders.</div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

import { motion } from "framer-motion";

export function VSBadge({ accent, styles, impactHit }) {
  const hit = !!impactHit;
  return (
    <motion.div
      style={styles.vsLayer}
      animate={{ scale: hit ? 1.06 : 1 }}
      transition={{ type: "spring", stiffness: 520, damping: 28, mass: 0.55 }}
    >
      <motion.div
        style={{
          ...styles.vsDiamond,
          borderColor: `${accent}aa`,
          boxShadow: hit
            ? `0 0 0 1px rgba(0,0,0,.95), 0 0 34px ${accent}44`
            : `0 0 0 1px rgba(0,0,0,.95), 0 0 26px ${accent}28`,
        }}
        animate={{
          scale: hit ? 1.05 : 1,
          opacity: hit ? 1 : 1,
        }}
        transition={{ duration: 0.1 }}
      >
        <div style={styles.vsInner}>VS</div>
      </motion.div>
    </motion.div>
  );
}

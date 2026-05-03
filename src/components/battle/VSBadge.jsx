import { motion } from "framer-motion";

/** VS diamond — parent mounts this only after arena intro title has fully exited */
export function VSBadge({ accent, styles, impactHit }) {
  const hit = !!impactHit;

  return (
    <motion.div
      style={styles.vsLayer}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
    >
      <div
        style={{
          ...styles.vsDiamond,
          borderColor: `${accent}66`,
          boxShadow: hit
            ? `0 0 0 1px rgba(0,0,0,.93), 0 0 18px ${accent}2c, inset 0 1px 0 rgba(255,255,255,.06)`
            : `0 0 0 1px rgba(0,0,0,.93), 0 0 14px ${accent}18, inset 0 1px 0 rgba(255,255,255,.05)`,
          transform: hit ? "rotate(45deg) scale(1.03)" : styles.vsDiamond.transform,
          transition: "transform 95ms ease-out, box-shadow 95ms ease-out, border-color 95ms ease-out",
        }}
      >
        <div style={styles.vsInner}>VS</div>
      </div>
    </motion.div>
  );
}

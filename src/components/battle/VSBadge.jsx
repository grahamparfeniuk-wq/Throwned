import { motion } from "framer-motion";

/** VS diamond — fades while arena intro label is visible so only one center focal element reads */
export function VSBadge({ accent, styles, impactHit, arenaLabelVisible }) {
  const hit = !!impactHit;
  const hideVs = !!arenaLabelVisible;

  return (
    <motion.div
      style={styles.vsLayer}
      initial={{ opacity: hideVs ? 0 : 1 }}
      animate={{ opacity: hideVs ? 0 : 1 }}
      transition={
        hideVs
          ? { duration: 0.32, ease: [0.25, 0.1, 0.25, 1] }
          : { duration: 0.48, delay: 0.34, ease: [0.22, 1, 0.36, 1] }
      }
    >
      <div
        style={{
          ...styles.vsDiamond,
          borderColor: `${accent}77`,
          boxShadow: hit
            ? `0 0 0 1px rgba(0,0,0,.94), 0 0 22px ${accent}38, inset 0 1px 0 rgba(255,255,255,.07)`
            : `0 0 0 1px rgba(0,0,0,.94), 0 0 18px ${accent}22, inset 0 1px 0 rgba(255,255,255,.05)`,
          transform: hit ? "rotate(45deg) scale(1.03)" : styles.vsDiamond.transform,
          transition: "transform 95ms ease-out, box-shadow 95ms ease-out, border-color 95ms ease-out",
        }}
      >
        <div style={styles.vsInner}>VS</div>
      </div>
    </motion.div>
  );
}

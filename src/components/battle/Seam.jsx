import { motion } from "framer-motion";

export function Seam({ portrait, accent, pulse, impactHit, dragging, styles }) {
  const hit = !!impactHit;
  return (
    <motion.div
      animate={{
        opacity: hit ? 1 : pulse ? 1 : dragging ? 0.85 : 0.52,
        scale: hit ? 1.09 : pulse ? 1.05 : dragging ? 1.02 : 1,
      }}
      transition={{ duration: hit ? 0.09 : 0.16 }}
      style={
        portrait
          ? { ...styles.seamPortrait, background: `linear-gradient(90deg, transparent, ${accent}f0, transparent)` }
          : { ...styles.seamLandscape, background: `linear-gradient(180deg, transparent, ${accent}f0, transparent)` }
      }
    />
  );
}

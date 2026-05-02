import { motion } from "framer-motion";

export function Seam({ portrait, accent, pulse, dragging, styles }) {
  return (
    <motion.div
      animate={{
        opacity: pulse ? 1 : dragging ? 0.85 : 0.52,
        scale: pulse ? 1.05 : dragging ? 1.02 : 1,
      }}
      transition={{ duration: 0.16 }}
      style={
        portrait
          ? { ...styles.seamPortrait, background: `linear-gradient(90deg, transparent, ${accent}f0, transparent)` }
          : { ...styles.seamLandscape, background: `linear-gradient(180deg, transparent, ${accent}f0, transparent)` }
      }
    />
  );
}

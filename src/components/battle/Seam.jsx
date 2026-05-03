import { motion } from "framer-motion";

export function Seam({ portrait, accent, pulse, impactHit, entranceHint, dragging, styles }) {
  const hit = !!impactHit;
  const entrance = !!entranceHint && !hit;
  return (
    <motion.div
      animate={{
        opacity: hit ? 1 : pulse ? 1 : entrance ? 0.74 : dragging ? 0.85 : 0.52,
        scale: hit ? 1.09 : pulse ? 1.05 : entrance ? 1.028 : dragging ? 1.02 : 1,
      }}
      transition={{ duration: hit ? 0.09 : entrance ? 0.26 : 0.16 }}
      style={
        portrait
          ? {
              ...styles.seamPortrait,
              background: `linear-gradient(90deg, transparent 0%, ${accent}55 22%, ${accent}cc 50%, ${accent}55 78%, transparent 100%)`,
              boxShadow: `0 0 14px ${accent}28, 0 0 36px ${accent}14, 0 1px 0 rgba(255,255,255,.06)`,
            }
          : {
              ...styles.seamLandscape,
              background: `linear-gradient(180deg, transparent 0%, ${accent}55 22%, ${accent}cc 50%, ${accent}55 78%, transparent 100%)`,
              boxShadow: `0 0 14px ${accent}28, 0 0 36px ${accent}14, 1px 0 0 rgba(255,255,255,.05)`,
            }
      }
    />
  );
}

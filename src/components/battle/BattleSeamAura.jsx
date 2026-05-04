import { motion } from "framer-motion";

/**
 * Residual arena atmosphere after intro — soft broadcast-style glow on the divide.
 * z-index sits above the seam line, below the VS diamond.
 */
export function BattleSeamAura({ portrait, accent, auraMul = 1, styles }) {
  const m = typeof auraMul === "number" && auraMul > 0 ? Math.min(1.58, auraMul) : 1;

  const bg = portrait
    ? `radial-gradient(ellipse 112% 48% at 50% 50%, ${accent}24 0%, ${accent}0c 40%, transparent 70%)`
    : `radial-gradient(ellipse 48% 112% at 50% 50%, ${accent}24 0%, ${accent}0c 40%, transparent 70%)`;

  return (
    <motion.div
      aria-hidden
      initial={{ opacity: 0 }}
      animate={{ opacity: [0.092 * m, 0.168 * m, 0.092 * m] }}
      transition={{ duration: 7.2, repeat: Infinity, ease: "easeInOut" }}
      style={{
        ...styles.battleSeamAura,
        ...(portrait ? styles.battleSeamAuraPortrait : styles.battleSeamAuraLandscape),
        background: bg,
      }}
    />
  );
}

import { motion } from "framer-motion";

/**
 * Residual arena atmosphere after intro — soft broadcast-style glow on the divide.
 * z-index sits above the seam line, below the VS diamond.
 */
export function BattleSeamAura({ portrait, accent, auraMul = 1, styles }) {
  const m = typeof auraMul === "number" && auraMul > 0 ? Math.min(1.35, auraMul) : 1;

  const bg = portrait
    ? `radial-gradient(ellipse 108% 46% at 50% 50%, ${accent}1c 0%, ${accent}08 38%, transparent 68%)`
    : `radial-gradient(ellipse 46% 108% at 50% 50%, ${accent}1c 0%, ${accent}08 38%, transparent 68%)`;

  return (
    <motion.div
      aria-hidden
      initial={{ opacity: 0 }}
      animate={{ opacity: [0.07 * m, 0.13 * m, 0.07 * m] }}
      transition={{ duration: 7.2, repeat: Infinity, ease: "easeInOut" }}
      style={{
        ...styles.battleSeamAura,
        ...(portrait ? styles.battleSeamAuraPortrait : styles.battleSeamAuraLandscape),
        background: bg,
      }}
    />
  );
}

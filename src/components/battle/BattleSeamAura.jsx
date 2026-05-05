import { motion } from "framer-motion";

/**
 * Residual arena atmosphere after intro — soft broadcast-style glow on the divide.
 * z-index sits above the seam line, below the VS diamond.
 */
export function BattleSeamAura({ portrait, accent, auraMul = 1, styles }) {
  const m = typeof auraMul === "number" && auraMul > 0 ? Math.min(1.78, auraMul) : 1;

  const outer = portrait
    ? `radial-gradient(ellipse 108% 44% at 50% 50%, ${accent}28 0%, ${accent}0e 36%, transparent 72%)`
    : `radial-gradient(ellipse 44% 108% at 50% 50%, ${accent}28 0%, ${accent}0e 36%, transparent 72%)`;
  const core = portrait
    ? `radial-gradient(ellipse 42% 14% at 50% 50%, ${accent}1e 0%, ${accent}08 42%, transparent 78%)`
    : `radial-gradient(ellipse 14% 42% at 50% 50%, ${accent}1e 0%, ${accent}08 42%, transparent 78%)`;

  return (
    <motion.div
      aria-hidden
      initial={{ opacity: 0 }}
      animate={{ opacity: [0.1 * m, 0.182 * m, 0.1 * m] }}
      transition={{ duration: 7.2, repeat: Infinity, ease: "easeInOut" }}
      style={{
        ...styles.battleSeamAura,
        ...(portrait ? styles.battleSeamAuraPortrait : styles.battleSeamAuraLandscape),
        background: `${core}, ${outer}`,
      }}
    />
  );
}

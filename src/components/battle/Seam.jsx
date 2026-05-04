import { motion } from "framer-motion";

/**
 * Symbolic conflict line — decisive throws get tension + arena-colored compression (no arcade VFX).
 */
export function Seam({
  portrait,
  accent,
  pulse,
  impactHit,
  entranceHint,
  dragging,
  verdict,
  introSuppressed,
  arenaEnergyMul = 1,
  styles,
}) {
  const hit = !!impactHit;
  const entrance = !!entranceHint && !hit;
  const upset = !!verdict?.upset;
  const vi = verdict?.intensity ?? 0;
  const survivor = verdict?.survivorSide;
  const hideCenterLine = !!introSuppressed;
  const tier = verdict?.hierarchyTier ?? 0;
  const energy = (typeof arenaEnergyMul === "number" && arenaEnergyMul > 0 ? arenaEnergyMul : 1) * (1 + tier * 0.055);

  const midHex = upset ? `${accent}ee` : `${accent}cc`;
  const edgeHex = upset ? `${accent}66` : `${accent}55`;

  const scaleHit = hit
    ? upset
      ? (1.075 + vi * 0.065 + tier * 0.022) * Math.min(1.045, 0.02 + energy * 0.98)
      : 1.058
    : pulse
      ? 1.042
      : entrance
        ? 1.026
        : dragging
          ? 1.014
          : 1;

  const yNudge = hit && survivor && portrait ? (survivor === "first" ? -2.2 : 2.2) : 0;
  const xNudge = hit && survivor && !portrait ? (survivor === "first" ? -2 : 2) : 0;

  const glowCore = Math.round((upset ? 26 + Math.round(18 * vi) : 18) * energy);
  const glowHalo = Math.round((upset ? 22 + Math.round(12 * vi) : 14) * energy);

  const baseOpacity = hideCenterLine ? 0 : hit ? 1 : pulse ? 1 : entrance ? 0.72 : dragging ? 0.84 : 0.5;

  return (
    <motion.div
      animate={{
        opacity: baseOpacity,
        scale: hideCenterLine ? 1 : scaleHit,
        x: hideCenterLine ? 0 : xNudge,
        y: hideCenterLine ? 0 : yNudge,
      }}
      transition={{
        duration: hideCenterLine ? 0.28 : hit ? (upset ? 0.13 : 0.1) : entrance ? 0.3 : 0.17,
        ease: hideCenterLine ? [0.25, 0.1, 0.25, 1] : hit ? [0.22, 1, 0.36, 1] : [0.33, 1, 0.36, 1],
      }}
      style={
        portrait
          ? {
              ...styles.seamPortrait,
              background: `linear-gradient(90deg, transparent 0%, ${edgeHex} 22%, ${midHex} 50%, ${edgeHex} 78%, transparent 100%)`,
              boxShadow: `0 0 ${glowCore}px ${accent}44, 0 0 ${glowHalo + 28}px ${accent}1a, 0 1px 0 rgba(255,255,255,.07)`,
            }
          : {
              ...styles.seamLandscape,
              background: `linear-gradient(180deg, transparent 0%, ${edgeHex} 22%, ${midHex} 50%, ${edgeHex} 78%, transparent 100%)`,
              boxShadow: `0 0 ${glowCore}px ${accent}44, 0 0 ${glowHalo + 28}px ${accent}1a, 1px 0 0 rgba(255,255,255,.06)`,
            }
      }
    />
  );
}

import { motion } from "framer-motion";

/**
 * Symbolic conflict line — decisive throws get tension + arena-colored compression (no arcade VFX).
 * Idle battle: slightly richer line + slow breathing so the seam stays emotionally present.
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
  /** Tied to entrant hierarchy — only applied during challenger entrance (subconscious weight). */
  hierarchyEntranceMul = 1,
  styles,
}) {
  const hit = !!impactHit;
  const entrance = !!entranceHint && !hit;
  const upset = !!verdict?.upset;
  const vi = verdict?.intensity ?? 0;
  const survivor = verdict?.survivorSide;
  const hideCenterLine = !!introSuppressed;
  const tier = verdict?.hierarchyTier ?? 0;
  const streakBreak = !!verdict?.streakBreak;
  const majorStreakBreak = !!verdict?.majorStreakBreak;
  const baseEnergy =
    (typeof arenaEnergyMul === "number" && arenaEnergyMul > 0 ? arenaEnergyMul : 1) *
    (1 + tier * 0.122) *
    (streakBreak ? 1.1 : 1) *
    (majorStreakBreak ? 1.062 : 1);
  const he =
    entrance && typeof hierarchyEntranceMul === "number" && hierarchyEntranceMul > 0
      ? hierarchyEntranceMul
      : 1;
  const energy = entrance ? baseEnergy * he : baseEnergy;

  const midHex = upset ? `${accent}f0` : `${accent}e0`;
  const edgeHex = upset ? `${accent}72` : `${accent}66`;

  const scaleHit = hit
    ? upset
      ? (1.088 + vi * 0.094 + tier * 0.04 + (streakBreak ? 0.018 : 0)) *
        Math.min(1.06, 0.02 + energy * 0.99)
      : 1.058
    : pulse
      ? 1.042
      : entrance
        ? 1.018 + Math.min(0.038, (he - 0.92) * 0.28)
        : dragging
          ? 1.014
          : 1;

  const yNudge = hit && survivor && portrait ? (survivor === "first" ? -2.2 : 2.2) : 0;
  const xNudge = hit && survivor && !portrait ? (survivor === "first" ? -2 : 2) : 0;

  const idleLineBoost = !upset && !hit ? 11 : 0;
  const glowCore = Math.round(
    (upset ? 36 + Math.round(26 * vi) + tier * 6 + (streakBreak ? 10 : 0) : 30 + idleLineBoost) * energy
  );
  const glowHalo = Math.round(
    (upset ? 31 + Math.round(18 * vi) + tier * 5 + (streakBreak ? 9 : 0) : 25 + idleLineBoost) * energy
  );

  const breathingIdle =
    !hideCenterLine && !hit && !pulse && !entrance && !dragging;

  let opacityAnim = 0;
  if (hideCenterLine) opacityAnim = 0;
  else if (hit || pulse) opacityAnim = 1;
  else if (entrance) opacityAnim = 0.76;
  else if (dragging) opacityAnim = 0.88;
  else if (breathingIdle) opacityAnim = [0.72, 0.9, 0.72];
  else opacityAnim = 0.68;

  const opacityTransition = breathingIdle
    ? { opacity: { duration: 6.2, repeat: Infinity, ease: "easeInOut" } }
    : {
        opacity: {
          duration: hideCenterLine ? 0.28 : hit ? (upset ? 0.13 : 0.1) : entrance ? 0.3 : 0.2,
          ease: hideCenterLine ? [0.25, 0.1, 0.25, 1] : hit ? [0.22, 1, 0.36, 1] : [0.33, 1, 0.36, 1],
        },
      };

  const accentGlow = `${accent}52`;

  return (
    <motion.div
      animate={{
        opacity: opacityAnim,
        scale: hideCenterLine ? 1 : scaleHit,
        x: hideCenterLine ? 0 : xNudge,
        y: hideCenterLine ? 0 : yNudge,
      }}
      transition={{
        ...opacityTransition,
        scale: {
          duration: hideCenterLine ? 0.28 : hit ? (upset ? 0.13 : 0.1) : entrance ? 0.3 : 0.17,
          ease: hideCenterLine ? [0.25, 0.1, 0.25, 1] : hit ? [0.22, 1, 0.36, 1] : [0.33, 1, 0.36, 1],
        },
        x: { duration: 0.12, ease: [0.22, 1, 0.36, 1] },
        y: { duration: 0.12, ease: [0.22, 1, 0.36, 1] },
      }}
      style={
        portrait
          ? {
              ...styles.seamPortrait,
              background: `linear-gradient(90deg, transparent 0%, ${edgeHex} 16%, ${midHex} 50%, ${edgeHex} 84%, transparent 100%)`,
              boxShadow: `0 0 ${glowCore}px ${accentGlow}, 0 0 ${glowHalo + 40}px ${accent}2e, 0 1px 0 rgba(255,255,255,.09)`,
            }
          : {
              ...styles.seamLandscape,
              background: `linear-gradient(180deg, transparent 0%, ${edgeHex} 16%, ${midHex} 50%, ${edgeHex} 84%, transparent 100%)`,
              boxShadow: `0 0 ${glowCore}px ${accentGlow}, 0 0 ${glowHalo + 40}px ${accent}2e, 1px 0 0 rgba(255,255,255,.08)`,
            }
      }
    />
  );
}

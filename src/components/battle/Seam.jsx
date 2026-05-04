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
  const energy =
    (typeof arenaEnergyMul === "number" && arenaEnergyMul > 0 ? arenaEnergyMul : 1) *
    (1 + tier * 0.104) *
    (streakBreak ? 1.09 : 1) *
    (majorStreakBreak ? 1.055 : 1);

  const midHex = upset ? `${accent}ee` : `${accent}dc`;
  const edgeHex = upset ? `${accent}6c` : `${accent}62`;

  const scaleHit = hit
    ? upset
      ? (1.082 + vi * 0.088 + tier * 0.032 + (streakBreak ? 0.014 : 0)) *
        Math.min(1.055, 0.02 + energy * 0.985)
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

  const idleLineBoost = !upset && !hit ? 8 : 0;
  const glowCore = Math.round(
    (upset ? 32 + Math.round(24 * vi) + tier * 5 + (streakBreak ? 8 : 0) : 26 + idleLineBoost) * energy
  );
  const glowHalo = Math.round(
    (upset ? 28 + Math.round(16 * vi) + tier * 4 + (streakBreak ? 7 : 0) : 22 + idleLineBoost) * energy
  );

  const breathingIdle =
    !hideCenterLine && !hit && !pulse && !entrance && !dragging;

  let opacityAnim = 0;
  if (hideCenterLine) opacityAnim = 0;
  else if (hit || pulse) opacityAnim = 1;
  else if (entrance) opacityAnim = 0.76;
  else if (dragging) opacityAnim = 0.88;
  else if (breathingIdle) opacityAnim = [0.68, 0.86, 0.68];
  else opacityAnim = 0.68;

  const opacityTransition = breathingIdle
    ? { opacity: { duration: 6.2, repeat: Infinity, ease: "easeInOut" } }
    : {
        opacity: {
          duration: hideCenterLine ? 0.28 : hit ? (upset ? 0.13 : 0.1) : entrance ? 0.3 : 0.2,
          ease: hideCenterLine ? [0.25, 0.1, 0.25, 1] : hit ? [0.22, 1, 0.36, 1] : [0.33, 1, 0.36, 1],
        },
      };

  const accentGlow = `${accent}4e`;

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
              background: `linear-gradient(90deg, transparent 0%, ${edgeHex} 22%, ${midHex} 50%, ${edgeHex} 78%, transparent 100%)`,
              boxShadow: `0 0 ${glowCore}px ${accentGlow}, 0 0 ${glowHalo + 36}px ${accent}28, 0 1px 0 rgba(255,255,255,.08)`,
            }
          : {
              ...styles.seamLandscape,
              background: `linear-gradient(180deg, transparent 0%, ${edgeHex} 22%, ${midHex} 50%, ${edgeHex} 78%, transparent 100%)`,
              boxShadow: `0 0 ${glowCore}px ${accentGlow}, 0 0 ${glowHalo + 36}px ${accent}28, 1px 0 0 rgba(255,255,255,.07)`,
            }
      }
    />
  );
}

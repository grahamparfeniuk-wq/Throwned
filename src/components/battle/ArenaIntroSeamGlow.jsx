import { motion } from "framer-motion";
import {
  ARENA_INTRO_ENTER_EASE,
  ARENA_INTRO_ENTER_S,
  ARENA_INTRO_EXIT_EASE,
  ARENA_INTRO_EXIT_S,
} from "../../constants/arenaIntroMotion";

/**
 * Arena-intro-only illumination along the battle divide (horizontal in portrait, vertical in landscape).
 * Parent suppresses default Seam during intro; this layer energizes the midline from the title seal.
 */
export function ArenaIntroSeamGlow({ portrait, accent, styles }) {
  const mid = `${accent}e6`;
  const edge = `${accent}5a`;
  const halo = `${accent}2a`;

  const portraitGlow = [
    `0 0 12px ${halo}`,
    `0 0 32px ${accent}24`,
    `56px 0 48px ${accent}16`,
    `-56px 0 48px ${accent}16`,
    `0 1px 0 rgba(255,255,255,.08)`,
  ].join(", ");

  const landscapeGlow = [
    `0 0 12px ${halo}`,
    `0 0 32px ${accent}24`,
    `0 56px 48px ${accent}16`,
    `0 -56px 48px ${accent}16`,
    `1px 0 0 rgba(255,255,255,.07)`,
  ].join(", ");

  return (
    <motion.div
      aria-hidden
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{
        opacity: 0,
        transition: { duration: ARENA_INTRO_EXIT_S, ease: ARENA_INTRO_EXIT_EASE },
      }}
      transition={{
        opacity: { duration: ARENA_INTRO_ENTER_S, ease: ARENA_INTRO_ENTER_EASE },
      }}
      style={
        portrait
          ? {
              ...styles.arenaIntroSeamGlowPortrait,
              background: `linear-gradient(90deg, transparent 0%, ${edge} 14%, ${mid} 50%, ${edge} 86%, transparent 100%)`,
              boxShadow: portraitGlow,
            }
          : {
              ...styles.arenaIntroSeamGlowLandscape,
              background: `linear-gradient(180deg, transparent 0%, ${edge} 14%, ${mid} 50%, ${edge} 86%, transparent 100%)`,
              boxShadow: landscapeGlow,
            }
      }
    />
  );
}

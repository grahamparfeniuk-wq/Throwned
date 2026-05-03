import { motion } from "framer-motion";
import {
  ARENA_INTRO_ENTER_EASE,
  ARENA_INTRO_ENTER_S,
  ARENA_INTRO_EXIT_EASE,
  ARENA_INTRO_EXIT_S,
} from "../../constants/arenaIntroMotion";

/**
 * Intro-only: seam energy converges on the arena seal, then falls off along the divide.
 */
export function ArenaIntroSeamGlow({ portrait, accent, styles }) {
  const core = `${accent}ed`;
  const band = `${accent}64`;
  const soft = `${accent}2c`;

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
      style={styles.arenaIntroSeamGlowWrap}
    >
      {portrait ? (
        <>
          <div
            style={{
              ...styles.arenaIntroSeamConvergePortrait,
              background: `radial-gradient(ellipse min(86vw, 380px) 48px at 50% 50%, ${accent}50 0%, ${soft} 42%, transparent 72%)`,
            }}
          />
          <div
            style={{
              ...styles.arenaIntroSeamCorePortrait,
              background: `linear-gradient(90deg, transparent 0%, transparent 32%, ${band} 44%, ${core} 50%, ${band} 56%, transparent 68%, transparent 100%)`,
              boxShadow: `0 0 14px ${accent}30, 0 0 32px ${accent}16, 0 1px 0 rgba(255,255,255,.1)`,
            }}
          />
        </>
      ) : (
        <>
          <div
            style={{
              ...styles.arenaIntroSeamConvergeLandscape,
              background: `radial-gradient(ellipse 52px min(88vh, 620px) at 50% 50%, ${accent}50 0%, ${soft} 42%, transparent 72%)`,
            }}
          />
          <div
            style={{
              ...styles.arenaIntroSeamCoreLandscape,
              background: `linear-gradient(180deg, transparent 0%, transparent 32%, ${band} 44%, ${core} 50%, ${band} 56%, transparent 68%, transparent 100%)`,
              boxShadow: `0 0 14px ${accent}30, 0 0 32px ${accent}16, 1px 0 0 rgba(255,255,255,.09)`,
            }}
          />
        </>
      )}
    </motion.div>
  );
}

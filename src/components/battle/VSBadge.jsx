import { motion } from "framer-motion";

/** VS diamond — parent mounts this only after arena intro title has fully exited */
export function VSBadge({ accent, styles, impactHit, auraMul = 1 }) {
  const hit = !!impactHit;
  const a = typeof auraMul === "number" && auraMul > 0 ? Math.min(1.35, auraMul) : 1;

  const borderStrong = `${accent}8a`;
  const borderIdle = a >= 1.12 ? `${accent}8e` : a >= 1 ? `${accent}7a` : `${accent}6c`;
  const shadowIdle = `0 0 0 1px rgba(0,0,0,.93), 0 0 ${Math.round(20 * a)}px ${accent}2a, 0 0 ${Math.round(48 * a)}px ${accent}14, inset 0 1px 0 rgba(255,255,255,.07)`;
  const shadowHit = `0 0 0 1px rgba(0,0,0,.93), 0 0 ${Math.round(22 * a)}px ${accent}38, inset 0 1px 0 rgba(255,255,255,.08)`;

  return (
    <motion.div
      style={styles.vsLayer}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        animate={
          hit
            ? { scale: 1.03 }
            : { scale: [1, 1.012 * Math.min(1.04, 0.96 + a * 0.04), 1] }
        }
        transition={
          hit
            ? { duration: 0.095, ease: "easeOut" }
            : { duration: 6.5, repeat: Infinity, ease: "easeInOut" }
        }
        style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        {!hit ? (
          <div
            aria-hidden
            style={{
              position: "absolute",
              width: 112,
              height: 112,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${accent}12 0%, transparent 72%)`,
              filter: "blur(14px)",
              opacity: 0.85 * Math.min(1.15, a),
              pointerEvents: "none",
            }}
          />
        ) : null}
        <div
          style={{
            ...styles.vsDiamond,
            position: "relative",
            zIndex: 1,
            borderColor: hit ? borderStrong : borderIdle,
            boxShadow: hit ? shadowHit : shadowIdle,
            transform: hit ? "rotate(45deg) scale(1.03)" : styles.vsDiamond.transform,
            transition: "transform 95ms ease-out, box-shadow 95ms ease-out, border-color 95ms ease-out",
          }}
        >
          <div
            style={{
              ...styles.vsInner,
              textShadow: hit ? `0 0 14px ${accent}44` : `0 0 10px ${accent}28`,
            }}
          >
            VS
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

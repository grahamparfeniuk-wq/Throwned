import { motion } from "framer-motion";

/** VS diamond — parent mounts this only after arena intro title has fully exited */
export function VSBadge({ accent, styles, impactHit, auraMul = 1 }) {
  const hit = !!impactHit;
  const a = typeof auraMul === "number" && auraMul > 0 ? Math.min(1.75, auraMul) : 1;

  const borderStrong = `${accent}98`;
  const borderIdle = a >= 1.2 ? `${accent}96` : a >= 1.08 ? `${accent}86` : `${accent}76`;
  const shadowIdle = `0 0 0 1px rgba(0,0,0,.94), 0 0 0 0.5px ${accent}14, 0 0 ${Math.round(28 * a)}px ${accent}36, 0 0 ${Math.round(62 * a)}px ${accent}1e, inset 0 1px 0 rgba(255,255,255,.09)`;
  const shadowHit = `0 0 0 1px rgba(0,0,0,.94), 0 0 ${Math.round(28 * a)}px ${accent}42, inset 0 1px 0 rgba(255,255,255,.095)`;

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
            : { scale: [1, 1.014 * Math.min(1.045, 0.965 + a * 0.038), 1] }
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
              background: `radial-gradient(circle, ${accent}1e 0%, transparent 70%)`,
              filter: "blur(17px)",
              opacity: 0.92 * Math.min(1.22, a),
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
              textShadow: hit ? `0 0 16px ${accent}4c` : `0 0 13px ${accent}38`,
            }}
          >
            VS
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

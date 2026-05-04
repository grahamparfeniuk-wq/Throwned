import { motion } from "framer-motion";

/** VS diamond — parent mounts this only after arena intro title has fully exited */
export function VSBadge({ accent, styles, impactHit, auraMul = 1 }) {
  const hit = !!impactHit;
  const a = typeof auraMul === "number" && auraMul > 0 ? Math.min(1.55, auraMul) : 1;

  const borderStrong = `${accent}92`;
  const borderIdle = a >= 1.18 ? `${accent}92` : a >= 1.06 ? `${accent}82` : `${accent}72`;
  const shadowIdle = `0 0 0 1px rgba(0,0,0,.93), 0 0 ${Math.round(24 * a)}px ${accent}32, 0 0 ${Math.round(56 * a)}px ${accent}1a, inset 0 1px 0 rgba(255,255,255,.08)`;
  const shadowHit = `0 0 0 1px rgba(0,0,0,.93), 0 0 ${Math.round(26 * a)}px ${accent}3e, inset 0 1px 0 rgba(255,255,255,.09)`;

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
              background: `radial-gradient(circle, ${accent}18 0%, transparent 72%)`,
              filter: "blur(16px)",
              opacity: 0.9 * Math.min(1.18, a),
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
              textShadow: hit ? `0 0 15px ${accent}48` : `0 0 12px ${accent}32`,
            }}
          >
            VS
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

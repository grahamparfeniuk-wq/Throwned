import { motion } from "framer-motion";
import { enterVector } from "../../utils/media";
import { GestureLayer } from "./GestureLayer";
import { MediaSurface } from "./MediaSurface";

export function BattleSlot({ side, item, portrait, accent, active, paused, dimmed, winner, locked, entering, thrown, drag, onMove, onDone, onHoldStart, onHoldEnd, styles }) {
  return (
    <motion.div
      key={`${side}-${item?.id}`}
      initial={entering ? enterVector(side, portrait) : false}
      animate={
        thrown || {
          x: drag?.x || 0,
          y: drag?.y || 0,
          rotate: drag?.rotate || 0,
          opacity: 1,
          scale: 1,
        }
      }
      transition={{
        type: "spring",
        stiffness: thrown ? 330 : 245,
        damping: thrown ? 17 : 26,
        mass: 0.78,
        opacity: { duration: 0.12 },
      }}
      style={{ ...styles.slot, ...(portrait ? styles.slotPortrait : styles.slotLandscape) }}
    >
      <MediaSurface
        item={item}
        active={active}
        paused={paused}
        dimmed={dimmed}
        winner={winner}
        accent={accent}
        onHoldStart={onHoldStart}
        onHoldEnd={onHoldEnd}
        styles={styles}
      />
      <GestureLayer side={side} disabled={locked} onMove={onMove} onDone={onDone} styles={styles} />
    </motion.div>
  );
}

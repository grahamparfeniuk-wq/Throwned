import { motion } from "framer-motion";
import { enterVector } from "../../utils/media";
import { GestureLayer } from "./GestureLayer";
import { MediaSurface } from "./MediaSurface";

/** Challenger path: directional glide + opacity ramp + scale settle (keeps total motion ~under unlock window) */
const ENTER_TRANSITION = {
  type: "spring",
  stiffness: 238,
  damping: 30,
  mass: 0.64,
  opacity: { duration: 0.22, ease: [0.28, 0.95, 0.38, 1] },
};

/** Defending slot yields space slightly during challenger arrival */
const PEER_TRANSITION = {
  type: "spring",
  stiffness: 265,
  damping: 34,
  mass: 0.8,
};

const DRAG_TRANSITION = {
  type: "spring",
  stiffness: 245,
  damping: 26,
  mass: 0.78,
  opacity: { duration: 0.1 },
};

const THROW_TRANSITION = {
  type: "spring",
  stiffness: 520,
  damping: 31,
  mass: 0.62,
  opacity: { duration: 0.1 },
};

export function BattleSlot({
  side,
  item,
  portrait,
  accent,
  active,
  paused,
  dimmed,
  winner,
  locked,
  entering,
  incumbentDuringEntry,
  thrown,
  drag,
  clipId,
  onMove,
  onDone,
  onHoldPointerDown,
  onHoldPointerMove,
  onHoldPointerUp,
  freezeBattleGestures,
  styles,
}) {
  const peer = !!incumbentDuringEntry;

  const animateState =
    thrown ||
    (entering
      ? { x: 0, y: 0, rotate: 0, opacity: 1, scale: 1 }
      : {
          x: drag?.x || 0,
          y: drag?.y || 0,
          rotate: drag?.rotate || 0,
          opacity: 1,
          scale: peer ? 0.987 : 1,
        });

  const transition = thrown ? THROW_TRANSITION : entering ? ENTER_TRANSITION : peer ? PEER_TRANSITION : DRAG_TRANSITION;

  return (
    <motion.div
      key={`${side}-${item?.id}`}
      initial={entering ? enterVector(side, portrait) : false}
      animate={animateState}
      transition={transition}
      style={{ ...styles.slot, ...(portrait ? styles.slotPortrait : styles.slotLandscape) }}
    >
      <MediaSurface
        item={item}
        active={active}
        paused={paused}
        dimmed={dimmed}
        winner={winner}
        accent={accent}
        entranceEmphasis={!!entering}
        styles={styles}
      />
      <GestureLayer
        side={side}
        clipId={clipId}
        disabled={locked}
        freezeBattleGestures={freezeBattleGestures}
        onMove={onMove}
        onDone={onDone}
        onHoldPointerDown={onHoldPointerDown}
        onHoldPointerMove={onHoldPointerMove}
        onHoldPointerUp={onHoldPointerUp}
        styles={styles}
      />
    </motion.div>
  );
}

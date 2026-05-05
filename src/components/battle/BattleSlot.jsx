import { motion } from "framer-motion";
import { enterVector } from "../../utils/media";
import { BattleAftermathLine } from "./BattleAftermathLine";
import { GestureLayer } from "./GestureLayer";
import { MediaSurface } from "./MediaSurface";

/** Challenger path — inevitable entry into contention (smooth, not a feed swap) */
const ENTER_TRANSITION = {
  type: "spring",
  stiffness: 208,
  damping: 31,
  mass: 0.74,
  opacity: { duration: 0.27, ease: [0.22, 1, 0.36, 1] },
};

/** Survivor stabilizes after a win — damped, confident hold (not celebratory) */
const SURVIVOR_SETTLE_TRANSITION = {
  type: "spring",
  stiffness: 292,
  damping: 41,
  mass: 0.9,
  opacity: { duration: 0.14 },
};

const DRAG_TRANSITION = {
  type: "spring",
  stiffness: 245,
  damping: 26,
  mass: 0.78,
  opacity: { duration: 0.1 },
};

/** Elimination vector — decisive tween (acceleration + commitment, no arcade spin) */
const THROW_TRANSITION = {
  type: "tween",
  duration: 0.44,
  ease: [0.18, 0.9, 0.22, 1],
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
  /** Optional hierarchy-weighted spring overrides while `entering` (heavier = higher significance). */
  entranceSpring,
  /** Seam-adjacent aftermath copy (elimination wake); z-behind media */
  aftermath,
  /** Where the horizontal / vertical seam sits relative to this slot */
  aftermathSeamSide,
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

  const enterTransition =
    entering && entranceSpring
      ? {
          type: "spring",
          stiffness: entranceSpring.stiffness,
          damping: entranceSpring.damping,
          mass: entranceSpring.mass,
          opacity: {
            duration: entranceSpring.opacityDuration ?? ENTER_TRANSITION.opacity.duration,
            ease: [0.22, 1, 0.36, 1],
          },
        }
      : ENTER_TRANSITION;

  const transition = thrown
    ? THROW_TRANSITION
    : entering
      ? enterTransition
      : peer
        ? SURVIVOR_SETTLE_TRANSITION
        : DRAG_TRANSITION;

  return (
    <motion.div
      key={`${side}-${item?.id}`}
      initial={entering ? enterVector(side, portrait) : false}
      animate={animateState}
      transition={transition}
      style={{ ...styles.slot, ...(portrait ? styles.slotPortrait : styles.slotLandscape) }}
    >
      {aftermath?.text ? (
        <BattleAftermathLine
          text={aftermath.text}
          token={aftermath.token}
          accent={accent}
          portrait={portrait}
          seamSide={aftermathSeamSide}
          styles={styles}
        />
      ) : null}
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
